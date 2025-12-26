import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // const customer_phone = body.call?.from_number;
    // const business_phone = body.call?.to_number;

    const body = await req.json();

    const customer_phone = "999999";
    const business_phone = "1111111111";

    const { appointment_time } = body.args || {};

    if (!appointment_time) {
      return NextResponse.json(
        `Give them the appointments with the status: active that they have booked and ask them for confirmation`
      );
    }

    const { data: businesses } = await supabase
      .from("businesses")
      .select("id")
      .eq("phone_number", business_phone)
      .single();

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_number", customer_phone)
      .single();

    const { data: appointments, error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("business_id", businesses?.id)
      .eq("customer_id", existingCustomer?.id)
      .eq("time", appointment_time);

    console.log(error);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Appointment cancelled successfully for ${appointments}. Ask if they would like to reschedule for a different time.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
