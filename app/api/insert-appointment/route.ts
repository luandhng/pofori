import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();

    // Check for 'count' in arguments (e.g. from AI tool call) or directly in body
    // Default to 1 if not specified
    const rawCount = body.args?.count || body.count || "1";
    const count = parseInt(rawCount, 10) || 1;

    // Fallback phones for testing
    const businessPhone =
      body.call?.to_number || body.businessPhone || "1111111111";
    const customerPhone =
      body.call?.from_number || body.customerPhone || "999999";

    // 1. Get Context
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("phone_number", businessPhone)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_number", customerPhone)
      .single();

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const appointmentsToInsert = Array.from({ length: count }).map(() => ({
      business_id: business.id,
      customer_id: customer.id,
      status: "pending",
    }));

    // 3. Insert into Supabase
    const { error } = await supabase
      .from("appointments")
      .insert(appointmentsToInsert);

    if (error) {
      console.error("Insert Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. Response
    const msg =
      count === 1
        ? "I have started a new appointment for you."
        : `I have started ${count} new appointments for you.`;

    return NextResponse.json({
      message: msg,
      count: count,
    });
  } catch (error: any) {
    console.error("Insert-Appointment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
