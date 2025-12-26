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
      .select("id, opening_time, closing_time, date")
      .eq("phone_number", businessPhone)
      .single();
    const { data: services } = await supabase
      .from("services")
      .select("service, duration, price")
      .eq("business_id", business?.id);
    const { data: technicians } = await supabase
      .from("technicians")
      .select("id, first_name, last_name, available_date, skills")
      .eq("business_id", business?.id);

    const techniciansContext = technicians?.map(
      (t) =>
        `\n- Name: ${t.first_name} ${t.last_name} (ID: ${t.id}), Working dates: ${t.available_date}, Skills: ${t.skills}`
    );

    const servicesContext = services?.length
      ? services
          .map((s) => `- ${s.service}: $${s.price} (${s.duration}m)`)
          .join("\n")
      : "No services listed.";

    return NextResponse.json(
      `Working hours: from ${business?.opening_time} to ${business?.closing_time} on ${business?.date}\n Services: ${servicesContext}\n Technicians: ${techniciansContext}`
    );
  } catch (error: any) {
    return NextResponse.json(
      { found: false, error: error.message },
      { status: 500 }
    );
  }
}
