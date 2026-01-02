import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { services: service_query } = body.args || body;
    const businessPhone =
      body.call?.to_number || body.businessPhone || "1111111111";
    const customerPhone =
      body.call?.from_number || body.customerPhone || "999999";

    if (!service_query) {
      return NextResponse.json({
        found: false,
        message: "Please specify which service you are asking about.",
      });
    }

    // 1. Context Check
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("phone_number", businessPhone)
      .single();

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_number", customerPhone)
      .single();

    if (!business || !customer) {
      return NextResponse.json({ error: "Context missing" }, { status: 404 });
    }

    // 2. Fetch ALL Pending Appointments
    const { data: pendingAppointments } = await supabase
      .from("appointments")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("business_id", business.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (!pendingAppointments || pendingAppointments.length === 0) {
      return NextResponse.json({
        found: false,
        message: "I couldn't find any pending appointments to update.",
      });
    }

    // 3. Fetch Available Services
    const { data: allServices } = await supabase
      .from("services")
      .select("service, id")
      .eq("business_id", business.id);

    // 4. Parse & Match User Input
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "");

    const requestedList = service_query
      .split(/,| and /i)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    const validMatches: { id: string; name: string }[] = [];
    const missingServices: string[] = [];

    requestedList.forEach((reqItem: string) => {
      const reqClean = normalize(reqItem);
      const match = allServices?.find((s) => {
        const dbClean = normalize(s.service);
        return (
          s.service.toLowerCase().includes(reqItem.toLowerCase()) ||
          dbClean.includes(reqClean) ||
          reqClean.includes(dbClean)
        );
      });

      if (match) {
        // Avoid duplicate matches for the same service input
        if (!validMatches.find((vm) => vm.id === match.id)) {
          validMatches.push({ id: match.id, name: match.service });
        }
      } else {
        missingServices.push(reqItem);
      }
    });

    if (validMatches.length === 0) {
      return NextResponse.json({
        found: false,
        message: `I'm sorry, I couldn't find any services matching "${service_query}" in our menu.`,
      });
    }

    // 5. BROADCAST ASSIGNMENT LOGIC
    // Add EVERY matched service to EVERY pending appointment
    const servicesToInsert: any[] = [];

    pendingAppointments.forEach((appt) => {
      validMatches.forEach((match) => {
        servicesToInsert.push({
          appointment_id: appt.id,
          service_id: match.id,
        });
      });
    });

    // 6. Execute Insert
    if (servicesToInsert.length > 0) {
      const { error } = await supabase
        .from("appointment_services")
        .insert(servicesToInsert);

      if (error) {
        console.error("Insert Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // 7. Response Message construction
    const matchedNames = validMatches.map((m) => m.name).join(", ");
    let responseMessage = "";

    if (pendingAppointments.length === 1) {
      responseMessage = `Yes, I have added ${matchedNames} to your appointment.`;
    } else {
      responseMessage = `Yes, I have added ${matchedNames} to all ${pendingAppointments.length} appointments.`;
    }

    if (missingServices.length > 0) {
      responseMessage += ` (Note: I couldn't find "${missingServices.join(
        ", "
      )}" in our menu).`;
    }

    return NextResponse.json({
      found: true,
      message: responseMessage,
    });
  } catch (error: any) {
    console.error("Check-Services Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
