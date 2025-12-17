import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    // 1. Get Data
    const { customer_name, appointment_time } = body.args || body;

    // const customer_phone = body.call?.from_number;
    // const business_phone = body.call?.to_number;

    const customer_phone = "6578909982";
    const business_phone = "1111111111";

    if (!business_phone) {
      return NextResponse.json(
        { message: "Unknown Business Number" },
        { status: 400 }
      );
    }

    const { data: businesses, error: businessesError } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("phone_number", business_phone)
      .single();

    if (!customer_phone) {
      return NextResponse.json(
        { message: "No phone number found" },
        { status: 400 }
      );
    }

    // 2. CHECK: Is this a new customer?
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("customer_id, first_name")
      .eq("phone_number", customer_phone)
      .single();

    let customerId = existingCustomer?.customer_id;

    // 3. IF NEW: Add to customers table
    if (!customerId) {
      console.log("🆕 New Customer detected! Creating profile...");
      const { data: newCustomer, error: createError } = await supabase
        .from("customers")
        .insert([
          {
            first_name: customer_name,
            phone_number: customer_phone,
            business_id: businesses?.id,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      customerId = newCustomer.id;
    } else {
      console.log("✅ Regular Customer found.");
    }

    // 4. BOOK: Create appointment (linked to customer_id if you have that column, or just name/phone)
    const { error: bookingError } = await supabase.from("appointments").insert([
      {
        time: appointment_time,
        customer_id: customerId,
        business_id: businesses?.id,
        is_booked: true,
      },
    ]);

    if (bookingError) throw bookingError;

    return NextResponse.json({ message: "Success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
