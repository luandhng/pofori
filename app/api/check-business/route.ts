import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // const body = await req.json();
    // const customerPhone = body.call?.from_number; // Caller
    // const businessPhone = body.call?.to_number; // Salon being called

    const businessPhone = "1111111111"; // Salon being called

    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, opening_time, closing_time, date")
      .eq("phone_number", businessPhone)
      .single();

    if (!business) {
      return NextResponse.json({ found: false, message: "Salon not found" });
    }

    const { data: service } = await supabase
      .from("services")
      .select("service, duration, price")
      .eq("business_id", business.id);

    const { data: technician } = await supabase
      .from("technicians")
      .select("id, first_name, last_name, skills, available_date")
      .eq("business_id", business.id);

    // 5. Return context to AI
    return NextResponse.json({
      found: true,
      business,
      service,
      technician,
      system_instruction: `You are answering for a customer's question about the ${business}, ${service} and ${technician}. So you know everything about who is working there and what time. Always check the available date to make sure it is correct to what customer wants`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { found: false, error: error.message },
      { status: 500 }
    );
  }
}
