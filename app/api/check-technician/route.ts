import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const businessPhone = body.call?.to_number || "1111111111";
    const customerPhone = body.call?.from_number || "999999";
    const requestedTechnicianName = body.technician_name?.toLowerCase(); // "anyone" or specific name

    // 1. Get business and customer context
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

    // 2. Get the pending appointment
    const { data: appointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("business_id", business.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (!appointment) {
      return NextResponse.json(
        { error: "No pending appointment found" },
        { status: 404 }
      );
    }

    // 3. Get required services for this appointment
    const { data: requiredServices } = await supabase
      .from("appointment_services")
      .select("service_id")
      .eq("appointment_id", appointment.id);

    if (!requiredServices || requiredServices.length === 0) {
      return NextResponse.json(
        { error: "No services listed for appointment" },
        { status: 404 }
      );
    }

    const requiredServiceIds = requiredServices.map((r) => r.service_id);

    // 4. Find technicians who can do ALL the required services
    const { data: skills } = await supabase
      .from("technician_services")
      .select("technician_id, technician:technicians(id, first_name)")
      .in("service_id", requiredServiceIds);

    if (!skills || skills.length === 0) {
      return NextResponse.json({
        capable: false,
        message: "No technician is qualified for these services.",
      });
    }

    // Group by technician to find who has all required skills
    const techProfiles: Record<
      string,
      { count: number; name: string; id: string }
    > = {};

    skills.forEach((row: any) => {
      const techData = Array.isArray(row.technician)
        ? row.technician[0]
        : row.technician;
      const tId = techData?.id;
      const tName = techData?.first_name;

      if (!tId) return;

      if (!techProfiles[tId]) {
        techProfiles[tId] = { count: 0, name: tName, id: tId };
      }
      techProfiles[tId].count++;
    });

    // Filter to only technicians who have ALL required services
    const qualifiedTechs = Object.values(techProfiles).filter(
      (tech) => tech.count === requiredServiceIds.length
    );

    if (qualifiedTechs.length === 0) {
      return NextResponse.json({
        capable: false,
        message: "No technician is qualified for all these services.",
      });
    }

    // 5. Check if specific technician or anyone
    if (requestedTechnicianName && requestedTechnicianName !== "anyone") {
      // Check if the requested technician is qualified
      const requestedTech = qualifiedTechs.find(
        (tech) => tech.name.toLowerCase() === requestedTechnicianName
      );

      if (requestedTech) {
        // Assign the requested technician
        await supabase
          .from("appointments")
          .update({ technician_id: requestedTech.id })
          .eq("id", appointment.id);

        return NextResponse.json({
          capable: true,
          message: `${requestedTech.name} can do these services and has been assigned.`,
          technician: requestedTech.name,
        });
      } else {
        return NextResponse.json({
          capable: false,
          message: `${requestedTechnicianName} is not qualified for these services.`,
        });
      }
    } else {
      // Customer said "anyone" - assign first qualified technician
      const chosenTech = qualifiedTechs[0];

      await supabase
        .from("appointments")
        .update({ technician_id: chosenTech.id })
        .eq("id", appointment.id);

      return NextResponse.json({
        capable: true,
        message: `${chosenTech.name} can do these services and has been assigned.`,
        technician: chosenTech.name,
      });
    }
  } catch (error: any) {
    console.error("Check-Technician Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
