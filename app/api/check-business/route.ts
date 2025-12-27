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

    const { data: business } = await supabase
      .from("businesses")
      .select("id, operating_hours, name, time_zone")
      .eq("phone_number", businessPhone)
      .single();

    const SALON_TIMEZONE = business?.time_zone || "America/Los_Angeles";

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

    const { data: services } = await supabase
      .from("services")
      .select("service, duration, price")
      .eq("business_id", business?.id);

    const { data: technicians } = await supabase
      .from("technicians")
      .select("id, first_name, last_name, available_date, skills")
      .eq("business_id", business?.id);

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
    const techniciansContext = technicians
      ?.map((t) => `- ${t.first_name}`)
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
