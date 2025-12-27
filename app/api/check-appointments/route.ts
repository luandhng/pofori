import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// --- HELPER: UTC -> Readable Local Time ---
function utcToLocal(utcString: string, timeZone: string): string {
  try {
    return new Date(utcString).toLocaleString("en-US", {
      timeZone,
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true, // "December 25, 2:00 PM"
    });
  } catch (e) {
    console.error(
      `❌ Time Conversion Error for ${utcString} in ${timeZone}:`,
      e
    );
    return utcString; // Fallback
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("\n🔍 --- START: GET CUSTOMER APPOINTMENTS ---");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    console.log("📥 Raw Request Body:", JSON.stringify(body, null, 2));

    // 1. DYNAMIC INPUTS
    const phone_number = body.args?.phone_number || "999999";
    const business_phone = "1111111111"; // Or body.call?.to_number

    console.log(`👤 Looking for Customer Phone: ${phone_number}`);
    console.log(`🏢 Business Phone: ${business_phone}`);

    // 2. GET BUSINESS TIMEZONE
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, time_zone")
      .eq("phone_number", business_phone)
      .single();

    if (bizError || !business) {
      console.error("❌ Business Lookup Error:", bizError);
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const SALON_TIMEZONE = business?.time_zone || "UTC";
    console.log(`🌍 Detected Salon Timezone: ${SALON_TIMEZONE}`);

    // 3. FIND CUSTOMER
    const { data: customer, error: custError } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_number", phone_number)
      .eq("business_id", business?.id)
      .single();

    if (custError || !customer) {
      console.warn("⚠️ Customer not found in DB.");
      return NextResponse.json({
        found: false,
        message: "Customer record not found.",
      });
    }
    console.log(`✅ Found Customer ID: ${customer.id}`);

    // 4. FIND FUTURE APPOINTMENTS
    const nowISO = new Date().toISOString();
    console.log(`🕒 Searching for active appointments after: ${nowISO} (UTC)`);

    const { data: appts, error: apptError } = await supabase
      .from("appointments")
      .select("id, time, services, technician_id, status")
      .eq("customer_id", customer.id)
      .eq("status", "active")
      .gte("time", nowISO);

    if (apptError) {
      console.error(
        "❌ Database Error fetching appointments:",
        apptError.message
      );
      throw apptError;
    }

    console.log(`📦 DB Returned ${appts?.length || 0} appointment(s).`);

    if (!appts || appts.length === 0) {
      console.log("-> No future appointments found.");
      return NextResponse.json({
        found: false,
        message: "You don't have any active upcoming appointments.",
      });
    }

    // 5. FORMAT FOR AI
    const readableAppts = appts.map((a) => {
      const spoken = utcToLocal(a.time, SALON_TIMEZONE);
      console.log(`   - Appt [${a.id}]: UTC="${a.time}" -> Local="${spoken}"`);
      return {
        ...a,
        original_utc: a.time,
        spoken_time: spoken,
      };
    });

    const responseMsg = `Found ${appts.length} appointment(s). The first one is for ${readableAppts[0].services} on ${readableAppts[0].spoken_time}.`;
    console.log(`📤 Sending Response Message: "${responseMsg}"`);

    return NextResponse.json({
      found: true,
      appointments: readableAppts,
      message: responseMsg,
    });
  } catch (error: any) {
    console.error("❌ CRITICAL SYSTEM ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
