import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// --- HELPER: Calculate total duration from services ---
async function calculateServiceDuration(
  supabase: any,
  businessId: string,
  requestedServices: string[]
): Promise<number> {
  if (!requestedServices || requestedServices.length === 0) {
    return 60; // Default to 60 minutes
  }

  try {
    // Fetch all services for this business
    const { data: servicesData, error } = await supabase
      .from("services")
      .select("service, duration")
      .eq("business_id", businessId);

    if (error || !servicesData) {
      console.log("⚠️ Could not fetch services, using default 60 min");
      return 60;
    }

    let totalDuration = 0;

    // Match requested services with database services
    for (const reqService of requestedServices) {
      const matchedService = servicesData.find((s: any) =>
        s.service.toLowerCase().includes(reqService.toLowerCase()) ||
        reqService.toLowerCase().includes(s.service.toLowerCase())
      );

      if (matchedService) {
        totalDuration += matchedService.duration || 60;
        console.log(`   ✓ ${matchedService.service}: ${matchedService.duration}m`);
      } else {
        // Service not found, use default 60 min
        totalDuration += 60;
        console.log(`   ⚠️ ${reqService}: 60m (default - not found in DB)`);
      }
    }

    return totalDuration || 60;
  } catch (error) {
    console.error("Error calculating duration:", error);
    return 60; // Fallback
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("\n� CHECK-CONFLICTS: Starting validation...");

    // 1. Initialize Supabase with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { appointment_time, services, technician_id } = body.args || body;
    const businessPhone = body.call?.to_number || "1111111111";

    // 2. Input Validation
    if (!appointment_time) {
      console.log("❌ Missing appointment_time");
      return NextResponse.json(
        { available: false, error: "appointment_time is required" },
        { status: 400 }
      );
    }

    if (!technician_id) {
      console.log("❌ Missing technician_id");
      return NextResponse.json(
        { available: false, error: "technician_id is required" },
        { status: 400 }
      );
    }

    console.log(`📞 Business Phone: ${businessPhone}`);
    console.log(`🎯 Requested Time: ${appointment_time}`);
    console.log(`👤 Technician ID: ${technician_id}`);
    console.log(`🛠️ Services: ${services?.join(", ") || "none"}`);

    // 3. Get Business Info
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, time_zone")
      .eq("phone_number", businessPhone)
      .single();

    if (businessError || !business) {
      console.log("❌ Business not found");
      return NextResponse.json(
        { available: false, error: "Business not found" },
        { status: 404 }
      );
    }

    console.log(`🏢 Business: ${business.name} (ID: ${business.id})`);

    // 4. Calculate requested appointment duration
    const reqDurationMinutes = await calculateServiceDuration(
      supabase,
      business.id,
      services || []
    );

    console.log(`⏱️ Total Duration: ${reqDurationMinutes} minutes`);

    // 5. Setup time comparison
    const reqDate = new Date(appointment_time);
    const reqStart = reqDate.getTime();
    const reqEnd = reqStart + reqDurationMinutes * 60 * 1000;

    console.log(`🕒 Time Range: ${reqDate.toLocaleString()} (${reqDurationMinutes}m)`);

    // 6. Build query for existing appointments
    // Fetch all future active appointments for this business
    let query = supabase
      .from("appointments")
      .select("id, time, technician_id, services, status")
      .eq("business_id", business.id)
      .eq("status", "active") // Only check active appointments
      .gte("time", new Date().toISOString()); // Only future appointments

    // If specific technician requested, filter by them
    if (technician_id && technician_id.toUpperCase() !== "ANYONE") {
      query = query.eq("technician_id", technician_id);
    }

    const { data: existingAppointments, error: apptError } = await query;

    if (apptError) {
      console.log("❌ DB ERROR:", apptError.message);
      return NextResponse.json(
        { available: false, error: apptError.message },
        { status: 500 }
      );
    }

    console.log(
      `📦 Found ${existingAppointments?.length || 0} active future appointments`
    );

    // 7. Check for conflicts
    const conflictingAppointments: any[] = [];

    for (const appt of existingAppointments || []) {
      const apptStart = new Date(appt.time).getTime();

      // Calculate duration for existing appointment
      const apptDuration = await calculateServiceDuration(
        supabase,
        business.id,
        appt.services || []
      );
      const apptEnd = apptStart + apptDuration * 60 * 1000;

      console.log(
        `   Checking vs Appt #${appt.id}: ${new Date(appt.time).toLocaleString()} (${apptDuration}m)`
      );

      // Check for overlap: (StartA < EndB) AND (EndA > StartB)
      const isOverlapping = reqStart < apptEnd && reqEnd > apptStart;

      if (isOverlapping) {
        console.log(`   ❌ CONFLICT DETECTED!`);
        console.log(`      Requested: ${new Date(reqStart).toLocaleString()} - ${new Date(reqEnd).toLocaleString()}`);
        console.log(`      Existing:  ${new Date(apptStart).toLocaleString()} - ${new Date(apptEnd).toLocaleString()}`);
        
        conflictingAppointments.push({
          id: appt.id,
          time: appt.time,
          technician_id: appt.technician_id,
        });
      }
    }

    // 8. Handle results based on technician_id type
    if (technician_id.toUpperCase() === "ANYONE") {
      // If checking for "ANYONE", we need to find available technicians
      if (conflictingAppointments.length > 0) {
        // Get all technicians for this business
        const { data: allTechnicians } = await supabase
          .from("technicians")
          .select("id, first_name, last_name, skills, available_date")
          .eq("business_id", business.id);

        // Get the day of week from the requested appointment time
        const appointmentDay = new Date(appointment_time)
          .toLocaleString("en-US", { weekday: "long", timeZone: business.time_zone || "UTC" })
          .toLowerCase();

        console.log(`📅 Requested day: ${appointmentDay}`);

        // Filter out conflicted technicians
        const conflictedTechIds = new Set(
          conflictingAppointments.map((a) => a.technician_id)
        );

        // Filter technicians who are: 1) Not conflicted AND 2) Available on this day
        const availableTechnicians = allTechnicians?.filter((tech: any) => {
          // Check if not conflicted
          if (conflictedTechIds.has(tech.id)) {
            console.log(`   ❌ ${tech.first_name}: has conflict`);
            return false;
          }

          // Check if available on this day of week
          const availableDays = tech.available_date || [];
          const isAvailableOnDay = availableDays.some(
            (day: string) => day.toLowerCase() === appointmentDay
          );

          if (!isAvailableOnDay) {
            console.log(`   ❌ ${tech.first_name}: not available on ${appointmentDay} (works: ${availableDays.join(", ")})`);
            return false;
          }

          console.log(`   ✅ ${tech.first_name}: available!`);
          return true;
        });

        if (availableTechnicians && availableTechnicians.length > 0) {
          console.log(`✅ Found ${availableTechnicians.length} available technician(s)`);
          return NextResponse.json({
            available: true,
            available_technicians: availableTechnicians.map((t: any) => ({
              id: t.id,
              name: `${t.first_name} ${t.last_name}`,
            })),
            message: "Time is available with some technicians.",
          });
        } else {
          console.log(`❌ All technicians are booked`);
          return NextResponse.json({
            available: false,
            reason: "All technicians are booked at that time.",
          });
        }
      } else {
        console.log("✅ No conflicts found - time available for any technician");
        return NextResponse.json({
          available: true,
          message: "Time is available.",
        });
      }
    } else {
      // Specific technician requested
      if (conflictingAppointments.length > 0) {
        console.log(`❌ Technician ${technician_id} is not available`);
        return NextResponse.json({
          available: false,
          reason: "That time is already booked for this technician.",
          conflicts: conflictingAppointments,
        });
      } else {
        console.log(`✅ Technician ${technician_id} is available`);
        return NextResponse.json({
          available: true,
          technician_id: technician_id,
          message: "Time is available for this technician.",
        });
      }
    }
  } catch (error: any) {
    console.error("❌ System Error:", error);
    return NextResponse.json(
      { available: false, error: error.message },
      { status: 500 }
    );
  }
}
