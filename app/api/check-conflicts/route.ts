import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// --- HELPERS ---
const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, "");

export async function POST(req: NextRequest) {
  try {
    console.log("\n🚨 STARTING NUCLEAR DEBUG CHECK...");

    // 1. Force Admin Access (Bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { appointment_time, services, technician_id } = body.args || body;
    const businessPhone = body.call?.to_number || "1111111111";

    // 2. Setup Comparison Times (Use Timestamps for Accuracy)
    const reqDate = new Date(appointment_time);
    const reqStart = reqDate.getTime();

    // Calculate requested duration (default 60 mins)
    // You can add your service duration logic back here later
    const reqDurationMinutes = 60;
    const reqEnd = reqStart + reqDurationMinutes * 60 * 1000;

    console.log(
      `🎯 TARGET: ${reqDate.toLocaleString()} (Timestamp: ${reqStart})`
    );
    console.log(`👤 TECH ID: ${technician_id}`);

    // --- THE FIX: WIDEN THE SEARCH ---
    // Instead of filtering by specific hour, we grab ALL future appointments for this tech.
    // This bypasses any "Timezone Offset" issues in the SQL query.

    let query = supabase
      .from("appointments")
      .select("id, time, technician_id, services")
      .gte("time", new Date().toISOString()); // Only fetch future apps

    // If a specific tech is requested, filter by them.
    if (technician_id && technician_id !== "ANYONE") {
      query = query.eq("technician_id", technician_id);
    }

    const { data: allAppointments, error } = await query;

    if (error) {
      console.log("❌ DB ERROR:", error.message);
      return NextResponse.json({ available: false, error: error.message });
    }

    console.log(
      `📦 DB RETURNED: ${allAppointments?.length || 0} future appointments.`
    );

    // 3. JAVASCRIPT FILTERING (The Truth)
    // We manually check every single appointment in memory.

    let conflictFound = false;
    let conflictReason = "";

    for (const appt of allAppointments || []) {
      const apptStart = new Date(appt.time).getTime();

      // Assume existing appointments are 60 mins (Safe Buffer)
      // Ideally, you fetch the service duration for this appointment here.
      const apptDuration = 60;
      const apptEnd = apptStart + apptDuration * 60 * 1000;

      console.log(
        `   checking vs Appt ${appt.id} (${new Date(
          appt.time
        ).toLocaleString()})`
      );

      // STRICT OVERLAP FORMULA
      // (StartA < EndB) and (EndA > StartB)
      const isOverlapping = reqStart < apptEnd && reqEnd > apptStart;

      if (isOverlapping) {
        // Double check ID if we scanned "ANYONE"
        if (
          technician_id === "ANYONE" ||
          appt.technician_id === technician_id
        ) {
          console.log("   ❌ HIT! CONFLICT DETECTED.");
          console.log(`      Req: ${reqStart} - ${reqEnd}`);
          console.log(`      Existing: ${apptStart} - ${apptEnd}`);
          conflictFound = true;
          conflictReason = "Time overlap";
          break;
        }
      }
    }

    if (conflictFound) {
      return NextResponse.json({
        available: false,
        reason: "That time is already booked.",
      });
    }

    console.log("✅ NO CONFLICTS FOUND.");
    return NextResponse.json({
      available: true,
      technician_id: technician_id, // Return the ID so we can book it
      message: "Time is available.",
    });
  } catch (error: any) {
    console.error("System Error:", error);
    return NextResponse.json({ available: false }, { status: 500 });
  }
}
