import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// --- TIMEZONE HELPERS ---
// 1. User's Local Time -> Database UTC
function localToUtc(localIsoString: string, timeZone: string): string {
  const date = new Date(localIsoString);
  const invDate = new Date(date.toLocaleString("en-US", { timeZone }));
  const diff = date.getTime() - invDate.getTime();
  return new Date(date.getTime() + diff).toISOString();
}

// 2. Database UTC -> Readable Local Time
function utcToLocal(utcString: string, timeZone: string): string {
  return new Date(utcString).toLocaleString("en-US", {
    timeZone,
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// --- MAIN API ---
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const {
      current_appointment_time,
      new_time,
      new_technician_id,
      new_services,
      service_update_mode = "append", // Default to "add" (append)
    } = body.args || body;

    // Hardcoded for testing (or use body.call.from_number / to_number)
    const business_phone = "1111111111";
    const customer_phone = "999999";

    // --- STEP 1: GET BUSINESS & TIMEZONE ---
    const { data: business } = await supabase
      .from("businesses")
      .select("id, time_zone")
      .eq("phone_number", business_phone)
      .single();

    // Default to UTC if not set in DB
    const SALON_TIMEZONE = business?.time_zone || "UTC";

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_number", customer_phone)
      .single();

    console.log(current_appointment_time);

    // --- STEP 2: FIND EXISTING APPOINTMENT ---
    // Convert AI's "Local Time" -> "Database UTC" to find the row
    if (!current_appointment_time) {
      return NextResponse.json({
        success: false,
        message: "I need to know which appointment time to update.",
      });
    }

    const searchTimeUtc = localToUtc(current_appointment_time, SALON_TIMEZONE);

    const { data: existingAppt } = await supabase
      .from("appointments")
      .select("*")
      .eq("business_id", business?.id)
      .eq("customer_id", customer?.id)
      .eq("time", searchTimeUtc)
      .single();

    if (!existingAppt) {
      console.log(
        `❌ Not Found. Input: ${current_appointment_time} -> Search UTC: ${searchTimeUtc}`
      );
      return NextResponse.json({
        success: false,
        message: "I couldn't find an appointment at that time.",
      });
    }

    // --- STEP 3: PREPARE NEW VALUES ---

    // A. Handle Time
    let finalTimeUtc = existingAppt.time;
    if (new_time) {
      finalTimeUtc = localToUtc(new_time, SALON_TIMEZONE);
    }

    // B. Handle Services (Append vs Replace)
    let finalServices = existingAppt.services || [];

    if (new_services && new_services.length > 0) {
      if (service_update_mode === "replace") {
        // "Just do a manicure instead" -> Wipe old, set new
        finalServices = new_services;
      } else {
        // "Also add a manicure" -> Keep old, add new
        const combined = [...finalServices, ...new_services];
        finalServices = Array.from(new Set(combined)); // Remove duplicates
      }
    }

    // --- STEP 4: PREPARE UPDATE OBJECT ---
    const updates: any = {};

    // Only add to 'updates' if the value actually changed
    if (finalTimeUtc !== existingAppt.time) updates.time = finalTimeUtc;
    if (new_technician_id && new_technician_id !== existingAppt.technician_id)
      updates.technician_id = new_technician_id;

    // Check deep equality for arrays
    if (
      JSON.stringify(finalServices) !== JSON.stringify(existingAppt.services)
    ) {
      updates.services = finalServices;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: true,
        message: "No changes were needed.",
      });
    }

    // --- STEP 5: SAVE TO DB ---
    const { error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", existingAppt.id);

    if (error) throw error;

    // --- STEP 6: RESPONSE ---
    // Convert UTC back to "4:00 PM" for the AI to say
    const readableTime = utcToLocal(finalTimeUtc, SALON_TIMEZONE);

    return NextResponse.json({
      success: true,
      // "Updated! Your Haircut and Manicure is set for December 25, 4:00 PM."
      message: `Updated! Your ${finalServices.join(
        " and "
      )} is set for ${readableTime}.`,

      // Send UTC time back to Retell so it updates its variable
      updated_iso_time: finalTimeUtc,
    });
  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
