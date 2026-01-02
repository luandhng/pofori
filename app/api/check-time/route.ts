import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// --- HELPER 1: Timezone Bridge ---
function localToUtc(localIsoString: string, timeZone: string): string {
  const date = new Date(localIsoString);
  const invDate = new Date(date.toLocaleString("en-US", { timeZone }));
  const diff = date.getTime() - invDate.getTime();
  return new Date(date.getTime() + diff).toISOString();
}

// --- HELPER 2: Check Time Window ---
function isTimeWithinShift(
  appointmentTime: Date,
  durationMinutes: number,
  shiftStart: string,
  shiftEnd: string,
  timeZone: string
): boolean {
  const parseToMins = (h: number, m: number) => h * 60 + m;
  const parseStr = (str: string) => {
    const [h, m] = str.split(":").map(Number);
    return parseToMins(h, m);
  };

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(appointmentTime);

  const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
  const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0");

  const startMins = parseToMins(h, m);
  const endMins = startMins + durationMinutes;

  const shiftStartMins = parseStr(shiftStart);
  const shiftEndMins = parseStr(shiftEnd);

  return startMins >= shiftStartMins && endMins <= shiftEndMins;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { appointment_time } = body.args || body;
    const businessPhone = body.businessPhone || "1111111111";
    const customerPhone = body.customerPhone || "999999";

    if (!appointment_time) {
      return NextResponse.json({
        available: false,
        message: "No time provided.",
      });
    }

    // 1. Context Check
    const { data: business } = await supabase
      .from("businesses")
      .select("id, time_zone")
      .eq("phone_number", businessPhone)
      .single();

    if (!business)
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    const SALON_TIMEZONE = business.time_zone || "America/Los_Angeles";

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_number", customerPhone)
      .single();

    if (!customer)
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );

    // 2. Fetch ALL Pending Appointments
    const { data: pendingAppointments } = await supabase
      .from("appointments")
      .select(
        `
        id, 
        technician_id, 
        appointment_services ( services ( duration ) )
      `
      )
      .eq("customer_id", customer.id)
      .eq("business_id", business.id)
      .eq("status", "pending");

    if (!pendingAppointments || pendingAppointments.length === 0) {
      return NextResponse.json(
        { error: "No pending appointments found." },
        { status: 404 }
      );
    }

    // 3. Validate Every Technician's Schedule
    const checkTimeUtc = localToUtc(appointment_time, SALON_TIMEZONE);
    const checkDateObj = new Date(checkTimeUtc);
    const appointmentDay = checkDateObj
      .toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: SALON_TIMEZONE,
      })
      .toLowerCase();

    for (const appt of pendingAppointments) {
      // If no tech assigned yet, we can't check their schedule.
      if (!appt.technician_id) {
        return NextResponse.json({
          available: false,
          message:
            "One of your appointments does not have a technician assigned yet. Please choose a technician first.",
        });
      }

      // A. Calculate Duration for THIS appointment
      let duration = 0;
      if (appt.appointment_services) {
        // [!] FIX: Handle Supabase array/object types
        duration = (appt.appointment_services as any[]).reduce((sum, item) => {
          const s = item.services;
          const d = Array.isArray(s)
            ? (s[0] as any)?.duration
            : (s as any)?.duration;
          return sum + (d || 0);
        }, 0);
      }
      if (duration === 0) duration = 60;

      // B. Fetch This Technician's Info & Schedule
      const { data: tech } = await supabase
        .from("technicians")
        .select(
          `
          first_name,
          technician_schedules ( day_of_week, start_time, end_time )
        `
        )
        .eq("id", appt.technician_id)
        .single();

      if (!tech)
        return NextResponse.json({
          available: false,
          message: "Technician not found.",
        });

      // C. Check Day of Week
      const schedules = tech.technician_schedules || [];
      // @ts-ignore
      const schedule = schedules.find(
        (s: any) => s.day_of_week.toLowerCase() === appointmentDay
      );

      if (!schedule) {
        return NextResponse.json({
          available: false,
          message: `I'm sorry, but ${tech.first_name} does not work on ${appointmentDay}s.`,
        });
      }

      // D. Check Hours (Shift)
      if (
        !isTimeWithinShift(
          checkDateObj,
          duration,
          schedule.start_time,
          schedule.end_time,
          SALON_TIMEZONE
        )
      ) {
        return NextResponse.json({
          available: false,
          message: `${
            tech.first_name
          } works on that day, but that time is outside their shift (${schedule.start_time.slice(
            0,
            5
          )} - ${schedule.end_time.slice(0, 5)}).`,
        });
      }

      // E. Check Conflicts with Existing Bookings
      const reqStart = checkDateObj.getTime();
      const reqEnd = reqStart + duration * 60 * 1000;

      const { data: conflicts } = await supabase
        .from("appointments")
        .select(`time, appointment_services ( services ( duration ) )`)
        .eq("business_id", business.id)
        .eq("status", "active") // Only active confirmed bookings
        .eq("technician_id", appt.technician_id)
        .gte("time", new Date().toISOString());

      let isConflict = false;
      conflicts?.forEach((c: any) => {
        const cStart = new Date(c.time).getTime();
        let cDur = 0;
        // Calc conflict duration
        (c.appointment_services as any[])?.forEach((item) => {
          const s = item.services;
          const d = Array.isArray(s)
            ? (s[0] as any)?.duration
            : (s as any)?.duration;
          cDur += d || 60;
        });
        if (cDur === 0) cDur = 60;

        const cEnd = cStart + cDur * 60 * 1000;

        // Overlap Check
        if (reqStart < cEnd && reqEnd > cStart) isConflict = true;
      });

      if (isConflict) {
        return NextResponse.json({
          available: false,
          message: `I'm sorry, but ${tech.first_name} is already fully booked at that time.`,
        });
      }
    }

    // 4. Success: Update ALL Appointments
    const idsToUpdate = pendingAppointments.map((a) => a.id);
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ time: checkTimeUtc })
      .in("id", idsToUpdate);

    if (updateError) {
      console.error("Update failed", updateError);
      return NextResponse.json({
        available: false,
        message: "System error updating appointments.",
      });
    }

    return NextResponse.json({
      available: true,
      message:
        "Yes, that time works for everyone! I have updated your appointments.",
      updated_time: checkTimeUtc,
    });
  } catch (error: any) {
    console.error("Check-Time Error:", error);
    return NextResponse.json(
      { available: false, error: error.message },
      { status: 500 }
    );
  }
}
