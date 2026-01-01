import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// --- HELPERS (The Bridge) ---

function localToUtc(localIsoString: string, timeZone: string): string {
  const date = new Date(localIsoString);
  const invDate = new Date(date.toLocaleString("en-US", { timeZone }));
  const diff = date.getTime() - invDate.getTime();
  return new Date(date.getTime() + diff).toISOString();
}

function utcToLocal(utcString: string, timeZone: string): string {
  return new Date(utcString).toLocaleString("en-US", {
    timeZone,
    dateStyle: "full",
    timeStyle: "short",
  });
}

// --- HELPER: Check Time Window (Reuse from check-conflicts) ---
function isTimeWithinShift(
  appointmentTime: Date,
  durationMinutes: number,
  shiftStart: string,
  shiftEnd: string,
  timeZone: string
): boolean {
  const getMinutesFromMidnight = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(date);

    const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
    const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0");
    return h * 60 + m;
  };

  const parseShiftTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const startMins = getMinutesFromMidnight(appointmentTime);
  const endMins = startMins + durationMinutes;
  const shiftStartMins = parseShiftTime(shiftStart);
  const shiftEndMins = parseShiftTime(shiftEnd);

  return startMins >= shiftStartMins && endMins <= shiftEndMins;
}

// --- HELPER: Calculate Duration & Get Service IDs ---
async function calculateServiceDetails(
  supabase: any,
  businessId: string,
  requestedServices: string[]
): Promise<{ duration: number; serviceIds: string[] }> {
  const result = { duration: 60, serviceIds: [] as string[] };
  if (!requestedServices || requestedServices.length === 0) return result;

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
}

// --- FIND AVAILABLE TECHNICIAN ---
async function findAvailableTechnician(
  supabase: any,
  businessId: string,
  appointmentTime: string,
  services: string[],
  requiredServiceIds: string[],
  durationMinutes: number,
  timeZone: string // [!] Added timezone param
): Promise<string | null> {
  try {
    console.log("\n🔍 Finding available technician...");

    // 1. Fetch technicians + Capabilities + Schedules
    const { data: technicians, error: techError } = await supabase
      .from("technicians")
      .select(
        `
        id, first_name, last_name, 
        technician_services ( service_id ),
        technician_schedules ( day_of_week, start_time, end_time )
      `
      )
      .eq("business_id", businessId);

    if (techError || !technicians || technicians.length === 0) return null;

    // 2. Filter by Capabilities AND Schedule
    const reqDate = new Date(appointmentTime);
    const dayName = reqDate
      .toLocaleDateString("en-US", { weekday: "long", timeZone })
      .toLowerCase();

    const qualifiedTechs = technicians.filter((tech: any) => {
      // A. Capability Check
      if (requiredServiceIds.length > 0) {
        const techServiceIds =
          tech.technician_services?.map((ts: any) => ts.service_id) || [];
        if (
          !requiredServiceIds.every((reqId) => techServiceIds.includes(reqId))
        ) {
          return false;
        }
      }

      // B. Schedule Check
      const schedule = tech.technician_schedules?.find(
        (s: any) => s.day_of_week.toLowerCase() === dayName
      );
      if (!schedule) return false; // Not working today

      return isTimeWithinShift(
        reqDate,
        durationMinutes,
        schedule.start_time,
        schedule.end_time,
        timeZone
      );
    });

    if (qualifiedTechs.length === 0) {
      console.log("⚠️ No qualified technicians working at this time.");
      return null;
    }

    // 3. Check availability (Conflicts)
    const reqStart = reqDate.getTime();
    const reqEnd = reqStart + durationMinutes * 60 * 1000;

    for (const tech of qualifiedTechs) {
      const { data: appointments, error: apptError } = await supabase
        .from("appointments")
        .select(
          `
          id, time,
          appointment_services ( services ( duration ) )
        `
        )
        .eq("technician_id", tech.id)
        .gte("time", new Date().toISOString());

      if (apptError) continue;

      let hasConflict = false;

      for (const appt of appointments || []) {
        const apptStart = new Date(appt.time).getTime();

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
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) return tech.id;
    }

    return null;
  } catch (error: any) {
    console.error("Error finding technician:", error);
    return null;
  }
}

// --- MAIN API ---

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { appointment_time, technician_id, services } = body.args || body;

    const customer_phone = "999999";
    const business_phone = "1111111111";

    // 1. Get Business
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, time_zone")
      .eq("phone_number", business_phone)
      .single();

    if (!business) return NextResponse.json({ error: "Business not found" });
    const SALON_TIMEZONE = business.time_zone || "America/Los_Angeles";

    // 2. Get Customer
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_number", customer_phone)
      .eq("business_id", business.id)
      .single();

    // 3. Prep Data
    const bookingTimeUtc = localToUtc(appointment_time, SALON_TIMEZONE);
    const { duration, serviceIds } = await calculateServiceDetails(
      supabase,
      business.id,
      services || []
    );

    // 4. Assign Technician
    let finalTechnicianId = technician_id;

    if (!technician_id || technician_id.toUpperCase() === "ANYONE") {
      const assignedId = await findAvailableTechnician(
        supabase,
        business.id,
        bookingTimeUtc,
        services || [],
        serviceIds,
        duration,
        SALON_TIMEZONE // [!] Pass timezone
      );

      if (!assignedId) {
        return NextResponse.json(
          { success: false, error: "No available technicians found." },
          { status: 400 }
        );
      }
      finalTechnicianId = assignedId;
    }

    // 5. Insert Appointment
    const { data: newAppt, error: bookingError } = await supabase
      .from("appointments")
      .insert([
        {
          time: bookingTimeUtc,
          customer_id: customer?.id,
          business_id: business.id,
          technician_id: finalTechnicianId,
          status: "active",
        },
      ])
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 6. Insert Services
    if (serviceIds.length > 0) {
      const serviceMap = serviceIds.map((sId) => ({
        appointment_id: newAppt.id,
        service_id: sId,
      }));

      const { error: serviceError } = await supabase
        .from("appointment_services")
        .insert(serviceMap);

      if (serviceError) console.error("Error linking services:", serviceError);
    }

    // 7. Response
    const readableTime = utcToLocal(bookingTimeUtc, SALON_TIMEZONE);

    return NextResponse.json({
      success: true,
      message: `Success. I have booked your appointment for ${readableTime}.`,
      booked_time_utc: bookingTimeUtc,
    });
  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
