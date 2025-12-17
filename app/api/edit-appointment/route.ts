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

    const customer_phone = "6998909982";
    const business_phone = "1111111111";

    const { appointment_time } = body.args || {};

    const { data: businesses, error: businessesError } = await supabase
      .from("businesses")
      .select("id")
      .eq("phone_number", business_phone)
      .single();

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_number", customer_phone)
      .single();

    // const { data: appointment } = await supabase
    //   .from("appointments")
    //   .select("id")
    //   .eq("customer_id", existingCustomer?.id)
    //   .eq("business_id", businesses?.id);

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("business_id", businesses?.id)
      .eq("customer_id", existingCustomer?.id)
      .eq("time", appointment_time);

    console.log(error);

    return NextResponse.json({ message: "Success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
