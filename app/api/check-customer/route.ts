import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();

    // 1. Get Both Numbers
    // const customerPhone = body.call?.from_number; // Caller
    // const businessPhone = body.call?.to_number; // Salon being called

    const customerPhone = "6998909982"; // Caller
    const businessPhone = "1111111111"; // Salon being called

    if (!customerPhone || !businessPhone) {
      return NextResponse.json({
        found: false,
        message: "Missing phone numbers",
      });
    }

    // 2. Identify the Salon
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("phone_number", businessPhone)
      .single();

    if (!business) {
      return NextResponse.json({ found: false, message: "Salon not found" });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id, first_name")
      .eq("phone_number", customerPhone)
      .eq("business_id", business.id)
      .single();

    const { data: service } = await supabase
      .from("services")
      .select("service, duration, price")
      .eq("business_id", business.id);

    const { data: technician } = await supabase
      .from("technicians")
      .select("id, first_name, last_name, skills, available_date")
      .eq("business_id", business.id);

    const { data: appointment } = await supabase
      .from("appointments")
      .select("id, time, technician, services")
      .eq("customer_id", customer?.id)
      .eq("business_id", business.id);

    const techRoster =
      technician && technician.length > 0
        ? technician
            .map(
              (tech) => `
        - **Name:** ${tech.first_name} ${tech.last_name || ""}
        - **Skills:** ${(tech.skills || []).join(", ")}
        - **Schedule:** ${(tech.available_date || []).join(", ")}
      `
            )
            .join("\n") // Add a new line between each person
        : "No specific technicians found.";

    const menuList =
      service && service.length > 0
        ? service
            .map((s) => `- ${s.service}: $${s.price} (${s.duration} mins)`)
            .join("\n")
        : "No services listed.";

    if (!customer) {
      return NextResponse.json({
        found: false,
        salon_name: business.name,
        system_instruction: `You are answering for ${business.name}. This is a new customer. Say 'Hi, welcome to ${business.name}!, what can i help you today?' `,
      });
    }

    return NextResponse.json({
      found: true,
      customer_name: customer.first_name,
      appointment,
      // Pass raw data if needed for other tools, but usually not needed for the prompt
      technician: technician,
      service: service,
      business,
      salon_name: business.name,
      is_regular: true,

      system_instruction: `
      ### SALON MENU
      ${menuList}

      ### TECHNICIAN ROSTER (STRICT RULES)
      ${techRoster}
      
      ### INSTRUCTIONS
      - You are answering for ${business.name}.
      - This is ${customer.first_name}, a regular customer.
      - **Review the Roster above:** If the user asks for a service, ONLY offer technicians who list that skill.
      - **Review the Schedule above:** Only offer times that match the technician's available days.
      
      Start by saying: 'Welcome back to ${business.name}, ${customer.first_name}! What can I help you today?'`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { found: false, error: error.message },
      { status: 500 }
    );
  }
}
