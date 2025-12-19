import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await req.json();

    // 1. Get IDs (Switch back to body.call variables when ready for production)
    const customerPhone = body.call?.from_number || "6998909982";
    const businessPhone = body.call?.to_number || "1111111111";

    if (!customerPhone || !businessPhone)
      throw new Error("Missing phone numbers");

    // 2. Identify Business
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("phone_number", businessPhone)
      .single();

    if (!business)
      return NextResponse.json({ found: false, message: "Salon not found" });

    const { data: customer } = await supabase
      .from("customers")
      .select("id, first_name")
      .eq("phone_number", customerPhone)
      .eq("business_id", business.id)
      .single();

    // 3. Fetch Context (Parallel is faster)
    const [servicesRes, techsRes, appointmentsRes] = await Promise.all([
      supabase
        .from("services")
        .select("service, duration, price")
        .eq("business_id", business.id),
      supabase
        .from("technicians")
        .select("id, first_name, last_name, skills, available_date")
        .eq("business_id", business.id),
      supabase
        .from("appointments")
        .select("time, technician_id, customer_id, business_id, services")
        .eq("business_id", business.id)
        .eq("customer_id", customer?.id),
    ]);

    const services = servicesRes.data || [];
    const techs = techsRes.data || [];
    const appointments = appointmentsRes.data || [];

    // 4. Format Data for AI
    const menu = services.length
      ? services
          .map((s) => `- ${s.service}: $${s.price} (${s.duration}m)`)
          .join("\n")
      : "No services listed.";

    const roster = techs.length
      ? techs
          .map(
            (t) =>
              `- Name: ${t.first_name} (ID: ${t.id})\n  Skills: ${(
                t.skills || []
              ).join(", ")}\n  Days: ${(t.available_date || []).join(", ")}`
          )
          .join("\n")
      : "No specific technicians.";

    const calendar = appointments.length
      ? appointments.map(
          (a) =>
            `- Time: ${a.time}\n Services: ${a.services || []}\n Customer: ${
              a.customer_id
            }\n Technician: ${a.technician_id}`
        )
      : "No appointments";

    // 5. Build Response
    const greeting = customer
      ? `Welcome back to ${business.name}, ${customer.first_name}!`
      : `Hi, welcome to ${business.name}!`;

    return NextResponse.json({
      found: !!customer,
      customer_name: customer?.first_name,
      salon_name: business.name,
      system_instruction: `
      ### SALON MENU
      ${menu}

      ### TECHNICIAN ROSTER (STRICT)
      ${roster}

      ### APPOINTMENTS
      ${calendar}
      
      ### INSTRUCTIONS
      You are answering for ${business.name}.
      Customer: ${
        customer ? `${customer.first_name} (Regular)` : "New Customer"
      }
      When the user selects a technician, you MUST use the 'ID' provided in the roster above for the 'technician_id' tool parameter.
      
      STRICT RULES:
      - Only offer technicians who list the requested skill.
      - Only offer times that match the technician's available days (Check the available days again really carefully, don't just book when the customer says tomorrow).
      - If the customer says anyone or any technician, find the one that matches the requested skills and available days.

      Start by saying: "${greeting} What can I help you today?"`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { found: false, error: error.message },
      { status: 500 }
    );
  }
}
