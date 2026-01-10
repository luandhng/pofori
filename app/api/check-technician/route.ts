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

    if (!business || !customer)
      return NextResponse.json({ error: "Context missing" }, { status: 404 });

    // 2. Fetch ALL Pending Appointments
    const { data: pendingAppointments } = await supabase
      .from("appointments")
      .select("*")
      .eq("customer_id", customer.id)
      .eq("business_id", business.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (!pendingAppointments || pendingAppointments.length === 0) {
      return NextResponse.json(
        { error: "No pending appointments found" },
        { status: 404 }
      );
    }

    const feedbackMessages: string[] = [];
    let allAssigned = true;

    // [!] KEY CHANGE: Track who is already booked in this batch
    const usedTechIds = new Set<string>();

    // 3. Process EACH Appointment
    for (let i = 0; i < pendingAppointments.length; i++) {
      const appointment = pendingAppointments[i];
      const label = pendingAppointments.length > 1 ? `Appt ${i + 1}: ` : "";

      // A. Get Services
      const { data: requiredServices } = await supabase
        .from("appointment_services")
        .select("service_id")
        .eq("appointment_id", appointment.id);

      if (!requiredServices || requiredServices.length === 0) {
        feedbackMessages.push(`${label}No services listed.`);
        continue;
      }

      const requiredIds = requiredServices.map((r) => r.service_id);

      // B. Find ALL Qualified Technicians (Must have ALL required IDs)
      const { data: skills } = await supabase
        .from("technician_services")
        .select("technician_id, technician:technicians(first_name)")
        .in("service_id", requiredIds);

      // Group skills by Technician
      const techProfiles: Record<string, { count: number; name: string }> = {};

      skills?.forEach((row: any) => {
        const tId = row.technician_id;
        const tName = Array.isArray(row.technician)
          ? row.technician[0]?.first_name
          : row.technician?.first_name;

        if (!techProfiles[tId]) techProfiles[tId] = { count: 0, name: tName };
        techProfiles[tId].count++;
      });

      // Filter 1: Who has the skills?
      // Filter 2: Who is NOT already assigned in this batch?
      const validCandidates = Object.keys(techProfiles)
        .filter((tId) => {
          const hasSkills = techProfiles[tId].count === requiredIds.length;
          const isFresh = !usedTechIds.has(tId); // [!] Check if used
          return hasSkills && isFresh;
        })
        .map((tId) => ({ id: tId, name: techProfiles[tId].name }));

      // C. Assign
      if (validCandidates.length > 0) {
        const chosenTech = validCandidates[0];

        // 1. Update Database
        await supabase
          .from("appointments")
          .update({ technician_id: chosenTech.id })
          .eq("id", appointment.id);

        // 2. Mark this tech as "Used" so they aren't picked for the next appt
        usedTechIds.add(chosenTech.id);

        feedbackMessages.push(`${label}Assigned ${chosenTech.name}.`);
      } else {
        // Fallback: Check if ANYONE (even used ones) could have done it
        const anyQualified = Object.keys(techProfiles).some(
          (tId) => techProfiles[tId].count === requiredIds.length
        );

        if (anyQualified) {
          feedbackMessages.push(
            `${label}We don't have enough unique technicians. Everyone qualified is already assigned to your other appointments.`
          );
        } else {
          feedbackMessages.push(
            `${label}No technician is qualified for these services.`
          );
        }
        allAssigned = false;
      }
    }

    return NextResponse.json({
      capable: allAssigned,
      message: feedbackMessages.join(" "),
    });
  } catch (error: any) {
    console.error("Check-Technician Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
