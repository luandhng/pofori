import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// --- HELPER 1: Calculate duration AND get Service IDs ---
async function calculateServiceDetails(
  supabase: any,
  businessId: string,
  requestedServices: string[]
): Promise<{ duration: number; serviceIds: string[] }> {
  const result = { duration: 60, serviceIds: [] as string[] };

  if (!requestedServices || requestedServices.length === 0) return result;

  try {
    const { data: servicesData } = await supabase
      .from("services")
      .select("id, service, duration")
      .eq("business_id", businessId);

    if (!servicesData) return result;

    let totalDuration = 0;
    const foundIds: string[] = [];

    for (const reqService of requestedServices) {
      const matchedService = servicesData.find(
        (s: any) =>
          s.service.toLowerCase().includes(reqService.toLowerCase()) ||
          reqService.toLowerCase().includes(s.service.toLowerCase())
      );

      if (matchedService) {
        totalDuration += matchedService.duration || 60;
        foundIds.push(matchedService.id);
      } else {
        totalDuration += 60;
      }
    }

    return { duration: totalDuration || 60, serviceIds: foundIds };
  } catch (error) {
    console.error("Error calculating details:", error);
    return result;
  }
}

// --- HELPER 2: Check Time Window ---
function isTimeWithinShift(
  appointmentTime: Date,
  durationMinutes: number,
  shiftStart: string,
  shiftEnd: string,
  timeZone: string
): boolean {
  const parseToMins = (h: number, m: number) => h * 60 + m;
  const parseStr = (str: string) => {
    const [h, m] = str.split(":").map(Number);
    return parseToMins(h, m);
  };

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(appointmentTime);

  const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
  const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0");

  const startMins = parseToMins(h, m);
  const endMins = startMins + durationMinutes;

  const shiftStartMins = parseStr(shiftStart);
  const shiftEndMins = parseStr(shiftEnd);

  return startMins >= shiftStartMins && endMins <= shiftEndMins;
}

export async function POST(req: NextRequest) {
  try {
    console.log("\n⏰ CHECK-TIME: Starting validation...");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { appointment_time, services, technician_id } = body.args || body;
    const businessPhone = body.call?.to_number || "1111111111";

    if (!appointment_time) {
      return NextResponse.json({
        available: false,
        message: "No time provided.",
      });
    }

    // 1. Get Business Info
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, time_zone")
      .eq("phone_number", businessPhone)
      .single();

    if (!business)
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    const SALON_TIMEZONE = business.time_zone || "America/Los_Angeles";

    // 2. Get Duration & IDs
    // Ensure services is an array
    const serviceList = Array.isArray(services)
      ? services
      : [services].filter(Boolean);
    const { duration: reqDurationMinutes, serviceIds: requiredServiceIds } =
      await calculateServiceDetails(supabase, business.id, serviceList);

    // 3. Fetch Technicians (Candidates)
    let techQuery = supabase
      .from("technicians")
      .select(
        `
        id, first_name, last_name,
        technician_schedules ( day_of_week, start_time, end_time ),
        technician_services ( service_id )
      `
      )
      .eq("business_id", business.id);

    if (technician_id && technician_id.toUpperCase() !== "ANYONE") {
      techQuery = techQuery.eq("id", technician_id);
    }

    const { data: candidates } = await techQuery;

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        available: false,
        message: "Technician not found.",
      });
    }

    // --- PIPELINE STEP 1: SKILL CHECK ---
    const qualifiedTechs = candidates.filter((tech: any) => {
      if (requiredServiceIds.length === 0) return true; // Pass if no specific service requested

      const techServiceIds =
        tech.technician_services?.map((ts: any) => ts.service_id) || [];
      return requiredServiceIds.every((reqId) =>
        techServiceIds.includes(reqId)
      );
    });

    if (qualifiedTechs.length === 0) {
      return NextResponse.json({
        available: false,
        message: "No technicians are qualified to perform this service.",
      });
    }

    // --- PIPELINE STEP 2: SCHEDULE CHECK ---
    const reqDate = new Date(appointment_time);
    const appointmentDay = reqDate
      .toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: SALON_TIMEZONE,
      })
      .toLowerCase();

    const workingTechs = qualifiedTechs.filter((tech: any) => {
      const schedule = tech.technician_schedules?.find(
        (s: any) => s.day_of_week.toLowerCase() === appointmentDay
      );

      if (!schedule) return false;

      return isTimeWithinShift(
        reqDate,
        reqDurationMinutes,
        schedule.start_time,
        schedule.end_time,
        SALON_TIMEZONE
      );
    });

    if (workingTechs.length === 0) {
      return NextResponse.json({
        available: false,
        conflict: true,
        message:
          "There is a conflict. The requested time is outside of our working hours for these technicians.",
      });
    }

    // --- PIPELINE STEP 3: CONFLICT CHECK ---
    const survivingIds = workingTechs.map((t: any) => t.id);
    const reqStart = reqDate.getTime();
    const reqEnd = reqStart + reqDurationMinutes * 60 * 1000;

    const { data: existingAppointments } = await supabase
      .from("appointments")
      .select(
        `
        id, time, technician_id,
        appointment_services ( services ( duration ) )
      `
      )
      .eq("business_id", business.id)
      .eq("status", "active")
      .in("technician_id", survivingIds)
      .gte("time", new Date().toISOString());

    const bookedTechIds = new Set();

    existingAppointments?.forEach((appt: any) => {
      const apptStart = new Date(appt.time).getTime();

      // Calculate duration of existing appt
      let apptDuration = 0;
      if (appt.appointment_services) {
        apptDuration = appt.appointment_services.reduce(
          (sum: number, item: any) => sum + (item.services?.duration || 0),
          0
        );
      }
      if (apptDuration === 0) apptDuration = 60;

      const apptEnd = apptStart + apptDuration * 60 * 1000;

      if (reqStart < apptEnd && reqEnd > apptStart) {
        bookedTechIds.add(appt.technician_id);
      }
    });

    const availableTechs = workingTechs.filter(
      (tech: any) => !bookedTechIds.has(tech.id)
    );

    // --- FINAL RESPONSE ---
    if (availableTechs.length > 0) {
      return NextResponse.json({
        available: true,
        message: "Yes, that time is available.",
      });
    } else {
      return NextResponse.json({
        available: false,
        message: "No, that time is already fully booked.",
      });
    }
  } catch (error: any) {
    console.error("Check-Time Error:", error);
    return NextResponse.json(
      { available: false, error: error.message },
      { status: 500 }
    );
  }
}
