import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await req.json();
    // const { first_name, last_name } = body.args || body;

    const customerPhone = body.call?.from_number || "999999";
    const businessPhone = body.call?.to_number || "1111111111";

    console.log("Customer Phone:", body.call?.from_number);
    console.log("Business Phone:", body.call?.to_number);

    const { data: business } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("phone_number", businessPhone)
      .single();

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id, first_name")
      .eq("phone_number", customerPhone)
      .eq("business_id", business?.id)
      .single();

    if (existingCustomer) {
      return NextResponse.json({
        message: `User is returned`,
      });
    } else {
      return NextResponse.json({
        message: `User is new`,
      });
    }

    // const { error } = await supabase.from("customers").insert([
    //   {
    //     first_name,
    //     last_name,
    //     phone_number: customerPhone,
    //     business_id: business?.id,
    //   },
    // ]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
