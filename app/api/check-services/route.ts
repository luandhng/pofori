import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    // We only care about the service query now
    const { services: service_query } = body.args || body;
    const businessPhone = body.call?.to_number || "1111111111";
    const customerPhone = body.call?.from_number || "999999";

    if (!service_query) {
      return NextResponse.json({
        found: false,
        message: "Please specify which service you are asking about.",
      });
    }

    // 1. Get Business Info
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

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Get the lastest appointment from this customer
    const { data: latestAppointment } = await supabase
      .from("appointments")
      .select("*")
      .eq("customer_id", customer.id)
      .eq("business_id", business.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // 2. Search for the Service
    const { data: allServices } = await supabase
      .from("services")
      .select("service, id")
      .eq("business_id", business.id);

    // Fuzzy search logic
    const matches =
      allServices?.filter((s) =>
        s.service.toLowerCase().includes(service_query.toLowerCase())
      ) || [];

    if (matches.length > 0) {
      const serviceName = matches[0].service;

      const { error } = await supabase.from("appointment_services").insert({
        appointment_id: latestAppointment.id,
        service_id: matches[0].id,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        found: true,
        message: `Yes, we offer ${serviceName}.`,
      });
    } else {
      return NextResponse.json({
        found: false,
        message: `I'm sorry, we don't offer a service called "${service_query}".`,
      });
    }
  } catch (error: any) {
    console.error("Check-Services Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
