import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { appointment_time, technician_id, services } = body.args || body;

    const customer_phone = "999999";
    const business_phone = "1111111111";

    // Business
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, opening_time, closing_time, date, time_zone")
      .eq("phone_number", business_phone)
      .single();

    // Customers
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_number", customer_phone)
      .eq("business_id", business?.id)
      .single();

    const { error: bookingError } = await supabase.from("appointments").insert([
      {
        time: appointment_time,
        customer_id: customer?.id,
        business_id: business?.id,
        technician_id: technician_id,
        services,
        is_booked: true,
      },
    ]);

    console.log(bookingError);

    return NextResponse.json({
      message: "Success",
    });
  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
