import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const businessPhone = body.call?.to_number || "1111111111";

    const { data: business } = await supabase
      .from("businesses")
      .select("name")
      .eq("phone_number", businessPhone)
      .single();

    return NextResponse.json(`Business name: ${business?.name}`);
  } catch (error: any) {
    return NextResponse.json(
      { found: false, error: error.message },
      { status: 500 }
    );
  }
}
