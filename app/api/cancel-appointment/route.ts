import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// --- HELPER: Convert Local Time to UTC ---
function localToUtc(localIsoString: string, timeZone: string): string {
  const date = new Date(localIsoString);
  const invDate = new Date(date.toLocaleString("en-US", { timeZone }));
  const diff = date.getTime() - invDate.getTime();
  return new Date(date.getTime() + diff).toISOString();
}

export async function POST(req: NextRequest) {
  try {
    console.log("\n🗑️ CANCEL-APPOINTMENT: Starting...");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();

    // TODO: Replace with actual phone numbers from call data
    const customer_phone = "999999";
    const business_phone = "1111111111";

    const { appointment_time } = body.args || {};

    console.log(`📞 Customer: ${customer_phone}`);
    console.log(`🏢 Business: ${business_phone}`);
    console.log(`🕒 Appointment Time (Local): ${appointment_time}`);

    // Validate input
    if (!appointment_time) {
      console.log("❌ No appointment_time provided");
      return NextResponse.json(
        `Give them the appointments with the status: active that they have booked and ask them for confirmation`
      );
    }

    // Get business info with timezone
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, time_zone")
      .eq("phone_number", business_phone)
      .single();

    if (businessError || !business) {
      console.log("❌ Business not found");
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    console.log(
      `🏢 Business: ${business.name} (Timezone: ${business.time_zone})`
    );

    // Get customer
    const { data: existingCustomer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_number", customer_phone)
      .single();

    if (customerError || !existingCustomer) {
      console.log("❌ Customer not found");
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    console.log(`👤 Customer ID: ${existingCustomer.id}`);

    // Convert local time to UTC for database query
    const SALON_TIMEZONE = business.time_zone || "UTC";
    const appointmentTimeUtc = localToUtc(appointment_time, SALON_TIMEZONE);

    console.log(`🔄 Converted to UTC: ${appointmentTimeUtc}`);

    // Update appointment status to cancelled
    const { data: appointments, error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("business_id", business.id)
      .eq("customer_id", existingCustomer.id)
      .eq("time", appointmentTimeUtc)
      .eq("status", "active") // Only cancel active appointments
      .select();

    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    if (!appointments || appointments.length === 0) {
      console.log("⚠️ No matching active appointment found");
      return NextResponse.json({
        success: false,
        message: "No active appointment found at that time.",
      });
    }

    console.log(`✅ Cancelled appointment ID: ${appointments[0].id}`);

    return NextResponse.json({
      success: true,
      message: `Appointment cancelled successfully. Ask if they would like to reschedule for a different time.`,
    });
  } catch (error: any) {
    console.error("❌ System Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
