import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// --- HELPERS (The Bridge) ---

function localToUtc(localIsoString: string, timeZone: string): string {
  const date = new Date(localIsoString);

  const invDate = new Date(date.toLocaleString("en-US", { timeZone }));

  const diff = date.getTime() - invDate.getTime();

  return new Date(date.getTime() + diff).toISOString();
}

// 2. Database UTC -> Readable Local Time (for the AI reply)
function utcToLocal(utcString: string, timeZone: string): string {
  return new Date(utcString).toLocaleString("en-US", {
    timeZone,
    dateStyle: "full",
    timeStyle: "short", // e.g., "Thursday, December 25, 2:00 PM"
  });
}

// --- FIND AVAILABLE TECHNICIAN ---
async function findAvailableTechnician(
  supabase: any,
  businessId: string,
  appointmentTime: string,
  services: string[],
  durationMinutes: number = 60
): Promise<string | null> {
  try {
    console.log("\n🔍 Finding available technician...");
    console.log(`   Services needed: ${services.join(", ")}`);

    // 1. Fetch all technicians with their skills
    const { data: technicians, error: techError } = await supabase
      .from("technicians")
      .select("id, first_name, last_name, skills")
      .eq("business_id", businessId);

    if (techError || !technicians || technicians.length === 0) {
      console.log("❌ No technicians found");
      return null;
    }

    console.log(`📋 Found ${technicians.length} technician(s)`);

    // 2. Filter by skills - technician must have all required skills
    const qualifiedTechs = technicians.filter((tech: any) => {
      const techSkills = tech.skills || [];
      const hasAllSkills = services.every((service) =>
        techSkills.some(
          (skill: string) =>
            skill.toLowerCase().includes(service.toLowerCase()) ||
            service.toLowerCase().includes(skill.toLowerCase())
        )
      );

      console.log(
        `   ${tech.first_name} ${tech.last_name}: skills=${techSkills.join(
          ", "
        )} - ${hasAllSkills ? "✅ QUALIFIED" : "❌ not qualified"}`
      );

      return hasAllSkills;
    });

    if (qualifiedTechs.length === 0) {
      console.log("⚠️ No technicians with matching skills found");
      // Fallback: if no exact match, return any technician
      console.log("   → Falling back to any available technician");
    }

    const candidateTechs =
      qualifiedTechs.length > 0 ? qualifiedTechs : technicians;

    // 3. Check availability for each candidate
    const reqDate = new Date(appointmentTime);
    const reqStart = reqDate.getTime();
    const reqEnd = reqStart + durationMinutes * 60 * 1000;

    console.log(`🕒 Checking availability for ${reqDate.toISOString()}`);

    for (const tech of candidateTechs) {
      console.log(`   Checking ${tech.first_name} ${tech.last_name}...`);

      // Fetch all future appointments for this technician
      const { data: appointments, error: apptError } = await supabase
        .from("appointments")
        .select("id, time, services")
        .eq("technician_id", tech.id)
        .gte("time", new Date().toISOString());

      if (apptError) {
        console.log(`   ❌ Error checking appointments: ${apptError.message}`);
        continue;
      }

      let hasConflict = false;

      // Check for overlaps
      for (const appt of appointments || []) {
        const apptStart = new Date(appt.time).getTime();
        const apptEnd = apptStart + 60 * 60 * 1000; // Assume 60 min duration

        // Overlap formula: (StartA < EndB) && (EndA > StartB)
        if (reqStart < apptEnd && reqEnd > apptStart) {
          console.log(`      ❌ Conflict with appointment at ${appt.time}`);
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) {
        console.log(`   ✅ ${tech.first_name} ${tech.last_name} is AVAILABLE!`);
        return tech.id;
      }
    }

    console.log("❌ No available technicians found");
    return null;
  } catch (error: any) {
    console.error("Error finding technician:", error);
    return null;
  }
}

// --- MAIN API ---

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { appointment_time, technician_id, services } = body.args || body;

    // Hardcoded for now (or grab from body.call)
    const customer_phone = "999999";
    const business_phone = "1111111111";

    // 1. Get Business & TIMEZONE
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, time_zone") // Ensure time_zone is selected
      .eq("phone_number", business_phone)
      .single();

    if (!business) return NextResponse.json({ error: "Business not found" });

    // Default to UTC if timezone is missing in DB
    const SALON_TIMEZONE = business.time_zone || "UTC";

    // 2. Get Customer
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_number", customer_phone)
      .eq("business_id", business.id)
      .single();

    // --- 3. CONVERT TIME (The Fix) ---
    // User Input (Local) -> Database Format (UTC)
    const bookingTimeUtc = localToUtc(appointment_time, SALON_TIMEZONE);

    console.log(
      `Booking: Input=${appointment_time} (${SALON_TIMEZONE}) -> UTC=${bookingTimeUtc}`
    );

    // --- 3.5. AUTO-ASSIGN TECHNICIAN IF "ANYONE" ---
    let finalTechnicianId = technician_id;

    if (!technician_id || technician_id.toLowerCase() === "anyone") {
      console.log("🤖 Auto-assigning technician...");
      const assignedId = await findAvailableTechnician(
        supabase,
        business.id,
        bookingTimeUtc,
        services || []
      );

      if (!assignedId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "No available technicians found for the requested time and services.",
          },
          { status: 400 }
        );
      }

      finalTechnicianId = assignedId;
      console.log(`✅ Auto-assigned technician: ${assignedId}`);
    }

    // 4. Insert into Supabase
    const { error: bookingError } = await supabase.from("appointments").insert([
      {
        time: bookingTimeUtc, // Save the UTC time!
        customer_id: customer?.id,
        business_id: business.id,
        technician_id: finalTechnicianId,
        services,
        is_booked: true,
      },
    ]);

    if (bookingError) throw bookingError;

    // --- 5. RESPONSE ---
    // Convert back to readable text so the AI confirms correctly
    // "I have booked you for Thursday at 2:00 PM"
    const readableTime = utcToLocal(bookingTimeUtc, SALON_TIMEZONE);

    return NextResponse.json({
      success: true,
      message: `Success. I have booked your appointment for ${readableTime}.`,
      booked_time_utc: bookingTimeUtc,
    });
  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
