import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { first_name, last_name, appointment_time, technician_id, services } =
      body.args || body;

    // Use hardcoded numbers for testing, or swap to body.call?.from_number for production
    const customer_phone = "6998909982";
    const business_phone = "1111111111";

    if (!business_phone || !customer_phone) {
      return NextResponse.json(
        { message: "Missing phone data" },
        { status: 400 }
      );
    }

    // 1. Get Business Info
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, opening_time, closing_time")
      .eq("phone_number", business_phone)
      .single();

    if (!business)
      return NextResponse.json(
        { message: "Business not found" },
        { status: 404 }
      );

    // --- 🛡️ START CONFLICT CHECK 🛡️ ---

    // A. Fetch ALL services for this salon to calculate durations
    // We need this map to calculate the duration of BOTH the new request AND existing appointments
    const { data: allServices } = await supabase
      .from("services")
      .select("service, duration")
      .eq("business_id", business.id);

    // Create a quick lookup map: { "Haircut": 30, "Color": 60 }
    const serviceDurationMap: Record<string, number> = {};
    allServices?.forEach((s) => {
      serviceDurationMap[s.service] = s.duration;
    });

    // B. Calculate NEW Appointment Duration & End Time
    const newApptDuration = services.reduce((total: number, sName: string) => {
      return total + (serviceDurationMap[sName] || 0);
    }, 0);

    const newStart = new Date(appointment_time);
    const newEnd = new Date(newStart.getTime() + newApptDuration * 60 * 1000);

    // C. Check Technician Schedule
    if (technician_id && technician_id !== "ANYONE") {
      // Fetch all appointments for this tech on the same day
      const startOfDay = new Date(newStart);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(newStart);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingAppts } = await supabase
        .from("appointments")
        .select("time, services") // We need services to know how long they occupied the tech
        .eq("technician_id", technician_id)
        .gte("time", startOfDay.toISOString())
        .lte("time", endOfDay.toISOString());

      // D. Check for Overlaps
      const hasConflict = existingAppts?.some((appt) => {
        // Calculate existing appointment duration
        const existingDuration = appt.services.reduce(
          (total: number, sName: string) => {
            return total + (serviceDurationMap[sName] || 0);
          },
          0
        );

        const existingStart = new Date(appt.time);
        const existingEnd = new Date(
          existingStart.getTime() + existingDuration * 60 * 1000
        );

        // THE OVERLAP FORMULA:
        // (Start A < End B) AND (End A > Start B)
        return newStart < existingEnd && newEnd > existingStart;
      });

      if (hasConflict) {
        console.log("❌ Conflict detected for technician");
        return NextResponse.json(
          {
            message:
              "Technician is already booked at this time. Please suggest a different time.",
          },
          { status: 409 }
        );
      }
    }
    // --- 🛡️ END CONFLICT CHECK 🛡️ ---

    // 2. Identify/Create Customer
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_number", customer_phone)
      .eq("business_id", business.id) // Ensure unique per business
      .single();

    let customerId = existingCustomer?.id;

    if (!customerId) {
      console.log("🆕 Creating new customer...");
      const { data: newCustomer, error: createError } = await supabase
        .from("customers")
        .insert([
          {
            first_name,
            last_name,
            phone_number: customer_phone,
            business_id: business.id,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      customerId = newCustomer.id;
    }

    // 3. Create the Booking
    const { error: bookingError } = await supabase.from("appointments").insert([
      {
        time: appointment_time,
        customer_id: customerId,
        business_id: business.id,
        technician_id: technician_id,
        services,
        is_booked: true,
      },
    ]);

    if (bookingError) throw bookingError;

    // Nice touch: Return the end time so AI knows exactly how long it is
    return NextResponse.json({
      message: "Success",
      details: `Booked from ${newStart.toLocaleTimeString()} to ${newEnd.toLocaleTimeString()}`,
    });
  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
