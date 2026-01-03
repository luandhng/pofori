import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const customerPhone =
      body.call?.from_number || body.customerPhone || "999999";
    const businessPhone =
      body.call?.to_number || body.businessPhone || "1111111111";

    // 1. Get Context
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("phone_number", businessPhone)
      .single();

    if (!business)
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_number", customerPhone)
      .eq("business_id", business.id)
      .single();

    if (!customer)
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );

    // 2. Fetch Pending Appointments
    const { data: pendingAppointments } = await supabase
      .from("appointments")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("business_id", business.id)
      .eq("status", "pending");

    if (!pendingAppointments || pendingAppointments.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No pending appointments found.",
      });
    }

    // 3. Update ALL to "active"
    const idsToBook = pendingAppointments.map((a) => a.id);

    const { error } = await supabase
      .from("appointments")
      .update({ status: "active" })
      .in("id", idsToBook);

    if (error) {
      console.error("Booking Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Great, I have booked all your appointments.",
    });
  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
