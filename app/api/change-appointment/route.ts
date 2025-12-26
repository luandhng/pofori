import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();

    const {
      current_appointment_time, // CRITICAL: To find the row
      new_time, // Optional
      new_technician_id, // Optional
      new_services, // Optional
    } = body.args || body;

    const customer_phone = "999999";
    const business_phone = "1111111111";
    // const customer_phone = body.call?.from_number;
    // const business_phone = body.call?.to_number;

    if (!current_appointment_time) {
      return NextResponse.json(
        {
          message: "I need to know which appointment time you want to change.",
        },
        { status: 400 }
      );
    }

    // 2. Identify Business & Customer
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("phone_number", business_phone)
      .single();

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_number", customer_phone)
      .eq("business_id", business?.id)
      .single();

    const { data: appointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("business_id", business?.id)
      .eq("customer_id", customer?.id)
      .eq("time", current_appointment_time)
      .single();

    if (!appointment) {
      return NextResponse.json({
        success: false,
        message:
          "I couldn't find an appointment at that original time to update.",
      });
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        time: new_time,
        services: new_services,
        technician_id: new_technician_id,
      })
      .eq("id", appointment.id)
      .select()
      .single();

    if (updateError) throw updateError;

    const changes = [];
    if (new_time)
      changes.push(`time to ${new Date(new_time).toLocaleString()}`);
    if (new_technician_id) changes.push(`technician`);
    if (new_services) changes.push(`services`);

    return NextResponse.json({
      success: true,
      message: `Successfully rescheduled. Changed ${changes.join(
        ", "
      )}. Ask if there is anything else.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
