import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await req.json();

    // 1. Get Phone Numbers (Robust Fallback)
    const customerPhone = body.call?.from_number || "6998909982";
    const businessPhone = body.call?.to_number || "1111111111"; // Your Retell number

    if (!customerPhone || !businessPhone) {
      throw new Error("Missing phone numbers");
    }

    // 2. Identify Business
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, opening_time, closing_time, date, time_zone") // Ensure 'time_zone' exists in DB!
      .eq("phone_number", businessPhone)
      .single();

    if (!business) {
      return NextResponse.json({ found: false, message: "Salon not found" });
    }

    // 3. Calculate "Business Time" (CRITICAL for AI)
    // We must tell the AI what "Right Now" is in the salon's city.
    const timeZone = business.time_zone || "America/New_York";
    const now = new Date();

    const currentBusinessTime = now.toLocaleString("en-US", {
      timeZone,
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });

    // 4. Fetch Context Data Parallel
    const { data: customer } = await supabase
      .from("customers")
      .select("id, first_name")
      .eq("phone_number", customerPhone)
      .eq("business_id", business.id)
      .single();

    const [servicesRes, techsRes, existingApptsRes] = await Promise.all([
      // A. Services
      supabase
        .from("services")
        .select("service, duration, price")
        .eq("business_id", business.id),

      // B. Technicians (Only active ones)
      supabase
        .from("technicians")
        .select("id, first_name, skills, available_date")
        .eq("business_id", business.id),

      // C. Customer's UPCOMING Appointments (for "When is my booking?")
      // We don't fetch *all* shop bookings here to save tokens. The Tool handles conflict checks.
      customer
        ? supabase
            .from("appointments")
            .select("time, technician_id, services")
            .eq("customer_id", customer.id)
            .gte("time", new Date().toISOString()) // Only future
        : Promise.resolve({ data: [] }),
    ]);

    const services = servicesRes.data || [];
    const techs = techsRes.data || [];
    const myAppointments = existingApptsRes.data || [];

    // 5. Format Strings for the LLM
    // We format these strictly so the AI parses them easily.

    const menuContext = services.length
      ? services
          .map((s) => `- ${s.service}: $${s.price} (${s.duration} mins)`)
          .join("\n")
      : "No services listed.";

    const rosterContext = techs.length
      ? techs
          .map(
            (t) =>
              `- Name: ${t.first_name} (ID: ${t.id})
           Skills: ${(t.skills || []).join(", ")}
           Working Days: ${(t.available_date || []).join(", ")}`
          )
          .join("\n")
      : "No specific technicians. Assign 'ANYONE'.";

    const appointmentContext = myAppointments.length
      ? myAppointments
          .map(
            (a) =>
              `- ${new Date(a.time).toLocaleString("en-US", {
                timeZone,
              })} with Tech ID: ${a.technician_id}`
          )
          .join("\n")
      : "No upcoming appointments.";

    // 6. Construct the System Prompt
    const greeting = customer
      ? `Welcome back to ${business.name}, ${customer.first_name}.`
      : `Hi, thanks for calling ${business.name}.`;

    return NextResponse.json({
      // Retell specific fields
      customer_name: customer?.first_name || "Guest",

      // This is the "Brain" of the agent
      system_instruction: `
### ROLE & CONTEXT
You are the receptionist for ${business.name}.
Your goal is to book appointments or answer questions.
You must be polite, professional, and efficient.

### 🕒 CURRENT TIME & LOCATION
- **Current Salon Time:** ${currentBusinessTime}
- **Time Zone:** ${timeZone}
- **Opening Hours:** ${business.opening_time} to ${business.closing_time}
- **Open Days:** ${business.date?.join(", ")}

### 📋 SERVICE MENU
${menuContext}

### 👥 TECHNICIAN ROSTER (Use these IDs)
${rosterContext}

### 📅 CUSTOMER'S EXISTING BOOKINGS
${appointmentContext}

### 🛡️ BOOKING RULES (CRITICAL)
1. **Technician Selection:** If the user selects a technician, you MUST use the exact **UUID** from the Roster above in the tool call.
2. **Availability Check:** Before calling the booking tool, check if the requested day is listed in the technician's "Working Days" above. If not, say "They don't work on that day."
3. **Past Dates:** Never book appointments in the past.
4. **Time Zone:** Assume all times the user says are in **${timeZone}**.

### 🗣️ STARTING THE CONVERSATION
Start by saying: "${greeting} How can I help you today?"
      `,
    });
  } catch (error: any) {
    console.error("Identify Caller Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
