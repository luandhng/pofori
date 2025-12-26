import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await req.json();
    const { first_name, last_name } = body.args || body;

    const customerPhone = body.call?.from_number || "999999";
    const businessPhone = body.call?.to_number || "1111111111";

    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, opening_time, closing_time, date, time_zone")
      .eq("phone_number", businessPhone)
      .single();

    const { error: customerError } = await supabase.from("customers").insert([
      {
        first_name,
        last_name,
        phone_number: customerPhone,
        business_id: business?.id,
      },
    ]);

    console.log(customerError);

    return NextResponse.json({
      message: `Customer created`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { found: false, error: error.message },
      { status: 500 }
    );
  }
}
