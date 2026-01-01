import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const businessPhone = body.call?.to_number || "1111111111";

    // 1. Get Business Info
    const { data: business } = await supabase
      .from("businesses")
      .select("id, operating_hours, name, time_zone")
      .eq("phone_number", businessPhone)
      .single();

    const SALON_TIMEZONE = business?.time_zone || "America/Los_Angeles";

    // 2. Get Current Time
    const now = new Date();
    const todayDate = now.toLocaleDateString("en-US", {
      timeZone: SALON_TIMEZONE,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const currentTime = now.toLocaleTimeString("en-US", {
      timeZone: SALON_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
    });

    // 3. Get Services
    const { data: services } = await supabase
      .from("services")
      .select("service, duration, price")
      .eq("business_id", business?.id);

    // 4. Get Technicians with Schedule & Skills
    // UPDATED: Now fetching 'technician_schedules' instead of 'available_date'
    const { data: technicians } = await supabase
      .from("technicians")
      .select(
        `
        id, 
        first_name, 
        last_name, 
        technician_schedules (
          day_of_week,
          start_time,
          end_time
        ),
        technician_services (
          services (
            service
          )
        )
      `
      )
      .eq("business_id", business?.id);

    // 5. Format Context Strings
    const sorter = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    const hoursContext = sorter
      .map((day) => {
        const config = business?.operating_hours?.[day];
        if (!config || !config.isOpen)
          return `- ${day.charAt(0).toUpperCase() + day.slice(1)}: Closed`;
        return `- ${day.charAt(0).toUpperCase() + day.slice(1)}: ${
          config.open
        } to ${config.close}`;
      })
      .join("\n");

    const servicesContext = services
      ?.map((s) => `- ${s.service}: $${s.price} (${s.duration}m)`)
      .join("\n");

    // UPDATED: Format the Technician List to include specific shifts
    const techniciansContext = technicians
      ?.map((t: any) => {
        // A. Format Skills
        const skillList = t.technician_services
          ?.map((ts: any) => ts.services?.service)
          .filter(Boolean)
          .join(", ");
        const skillsStr = skillList ? `(Skills: ${skillList})` : "";

        // B. Format Schedule (e.g., "Mon: 9am-5pm")
        // We filter schedules to only show days they are actually working
        const scheduleList = t.technician_schedules
          ?.map((sch: any) => {
            // Simple formatting: 09:00:00 -> 9am
            const start = sch.start_time.slice(0, 5);
            const end = sch.end_time.slice(0, 5);
            const dayShort =
              sch.day_of_week.charAt(0).toUpperCase() +
              sch.day_of_week.slice(1, 3);
            return `${dayShort} ${start}-${end}`;
          })
          .join(", ");

        const scheduleStr = scheduleList
          ? `[Shifts: ${scheduleList}]`
          : "[No shifts listed]";

        // Final Output: "- Sarah (Skills: Manicure) [Shifts: Mon 09:00-17:00, Tue...]"
        return `- ${t.first_name} ${t.last_name} (UUID: ${t.id}) ${skillsStr} ${scheduleStr}`;
      })
      .join("\n");

    return NextResponse.json(
      `
      Start every call knowing exactly what time it is.
      Current Date: ${todayDate}
      Current Time: ${currentTime}
      (All times discussed must be in the future relative to this time).

      Business Name: ${business?.name || "The Salon"}
      
      [[OPERATING HOURS]]
      ${hoursContext}

      [[SERVICES]]
      ${servicesContext}

      [[TECHNICIANS]]
      ${techniciansContext}
      `
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
