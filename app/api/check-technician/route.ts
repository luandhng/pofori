import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { technician_id } = body.args || body;

    const businessPhone = body.businessPhone || "1111111111";
    const customerPhone = body.customerPhone || "999999";

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

    if (!business)
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    if (!customer)
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );

    const { data: appointment } = await supabase
      .from("appointments")
      .select("*")
      .eq("customer_id", customer.id)
      .eq("business_id", business.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!appointment)
      return NextResponse.json(
        { error: "No pending appointment found" },
        { status: 404 }
      );

    // 1. Get the Services for this Appointment
    const { data: requiredServices } = await supabase
      .from("appointment_services")
      .select(`service_id, services ( service )`)
      .eq("appointment_id", appointment.id);

    if (!requiredServices || requiredServices.length === 0) {
      return NextResponse.json({
        capable: false,
        message: "This appointment has no services listed.",
      });
    }

    const requiredIds = requiredServices.map((r) => r.service_id);
    const serviceNames = requiredServices
      .map((r: any) => r.services?.service)
      .join(", ");

    // --- BRANCH A: "ANYONE" / "WHO ELSE?" ---
    if (
      !technician_id ||
      technician_id.toUpperCase() === "ANYONE" ||
      technician_id.toUpperCase() === "ANY"
    ) {
      // Find ALL rows in technician_services that match ANY of our required IDs
      const { data: allSkills } = await supabase
        .from("technician_services")
        .select(
          `
          technician_id,
          technician:technicians (first_name, last_name)
        `
        )
        .in("service_id", requiredIds);

      // Group capabilities by Technician
      // [!] FIXED: Added 'id' to the stored object type so we don't lose it
      const techCapabilityCount: Record<
        string,
        { count: number; name: string; id: string }
      > = {};

      allSkills?.forEach((row: any) => {
        const tId = row.technician_id;
        if (!techCapabilityCount[tId]) {
          techCapabilityCount[tId] = {
            count: 0,
            name: row.technician?.first_name,
            id: tId, // [!] Storing ID here now
          };
        }
        techCapabilityCount[tId].count += 1;
      });

      // Filter: Who has ALL the skills?
      const qualifiedTechs = Object.values(techCapabilityCount).filter(
        (t) => t.count === requiredIds.length
      );

      // Extract IDs and Names from the filtered list
      const capableIds = qualifiedTechs.map((t) => t.id);
      const capableNames = qualifiedTechs.map((t) => t.name);

      console.log("Capable IDs:", capableIds);
      console.log("Capable Names:", capableNames);

      if (capableIds.length > 0) {
        // Just pick the first qualified technician randomly or by first index
        // Ideally you'd check schedule availability here too, but following your logic:
        const { error } = await supabase
          .from("appointments")
          .update({ technician_id: capableIds[0] })
          .eq("id", appointment.id);

        if (error) {
          console.error("Error updating appointment:", error);
          return NextResponse.json({
            capable: false,
            message: "Error updating appointment.",
          });
        }

        return NextResponse.json({
          capable: true,
          technicians: capableNames,
          message: `Yes, I have updated the technician. ${
            capableNames[0]
          } is now assigned. (Other qualified options: ${capableNames.join(
            ", "
          )})`,
        });
      } else {
        return NextResponse.json({
          capable: false,
          message:
            "No other technicians are qualified to perform all the services in this appointment.",
        });
      }
    }

    // --- BRANCH B: SPECIFIC TECHNICIAN (e.g. "Switch to Sarah") ---
    else {
      // Check if this SPECIFIC person has ALL specific skills
      const { data: techSkills } = await supabase
        .from("technician_services")
        .select("service_id")
        .eq("technician_id", technician_id)
        .in("service_id", requiredIds);

      const techSkillIds = techSkills?.map((t) => t.service_id) || [];
      const isCapable = requiredIds.every((reqId) =>
        techSkillIds.includes(reqId)
      );

      const { data: techProfile } = await supabase
        .from("technicians")
        .select("id, first_name")
        .eq("id", technician_id)
        .single();

      const techName = techProfile?.first_name || "that technician";

      if (isCapable) {
        const { error } = await supabase
          .from("appointments")
          .update({ technician_id: techProfile?.id })
          .eq("id", appointment.id);

        if (error) {
          console.error("Error updating appointment:", error);
          return NextResponse.json({
            capable: false,
            message: "Error updating appointment.",
          });
        }

        return NextResponse.json({
          capable: true,
          message: `Yes, ${techName} is qualified and has been assigned to this appointment.`,
        });
      } else {
        return NextResponse.json({
          capable: false,
          message: `No, ${techName} is not qualified for this appointment (they cannot perform ${serviceNames}).`,
        });
      }
    }
  } catch (error: any) {
    console.error("Check-Technician Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
