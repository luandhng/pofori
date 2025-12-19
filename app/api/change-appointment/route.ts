import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();

    // 1. Inputs: We need to know WHICH appt to change (current) and WHAT to change it to (new)
    const {
      current_appointment_time, // CRITICAL: To find the row
      new_time, // Optional
      new_technician_id, // Optional
      new_services, // Optional
    } = body.args || body;

    // Hardcoded for testing (Swap these comments for production)
    const customer_phone = "9991111000";
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

    if (!business || !customer) {
      return NextResponse.json(
        { message: "Customer profile not found." },
        { status: 404 }
      );
    }

    // 3. Find the ORIGINAL Appointment first (to make sure it exists)
    const { data: appointment, error: findError } = await supabase
      .from("appointments")
      .select("id")
      .eq("business_id", business.id)
      .eq("customer_id", customer.id)
      .eq("time", current_appointment_time)
      .single();

    if (!appointment || findError) {
      return NextResponse.json({
        success: false,
        message:
          "I couldn't find an appointment at that original time to update.",
      });
    }

    // 4. Build the Update Object (Dynamic)
    // We only add fields that the user actually asked to change
    const updates: any = {};

    if (new_time) updates.time = new_time;
    if (new_services) updates.services = new_services;

    // Logic for Technician: Handle "Anyone" vs Specific UUID
    if (new_technician_id) {
      if (new_technician_id === "ANYONE") {
        updates.technician_id = null; // Set to NULL in DB
      } else {
        updates.technician_id = new_technician_id;
      }
    }

    // 5. Apply the Update
    const { data: updatedAppt, error: updateError } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", appointment.id) // Target the specific row we found earlier
      .select()
      .single();

    if (updateError) throw updateError;

    // 6. Return Context for AI
    // We create a readable string of what changed
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
