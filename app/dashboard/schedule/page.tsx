"use client";

import { CalendarEvent } from "@/app/types";
import { WeekCalendar } from "@/components/WeekCalendar";
import { useAppointments } from "@/hooks/use-appointments";
import { addMinutes } from "date-fns";

const Schedule = () => {
  const { data: rawAppointments, isLoading } = useAppointments();

  const events: CalendarEvent[] =
    rawAppointments?.map((appt: any) => {
      const serviceList =
        appt.appointment_services?.map((item: any) => item.services) || [];

      const totalDuration = serviceList.reduce(
        (sum: number, service: any) => sum + (service?.duration || 0),
        0
      );

      const start = new Date(appt.time);
      const end = addMinutes(start, totalDuration || 0);

      return {
        id: appt.id,
        technician_id: appt.technician_id,
        customer_id: appt.customer_id,
        appointment_services: appt.appointment_services,
        time: start,
        end: end,
        color: "blue",
        tip: appt.tip,
        payment: appt.payment,
        status: appt.status,
      };
    }) || [];

  return (
    <div className="h-full">
      {isLoading ? (
        "Loading.."
      ) : (
        <div className="h-full">
          <WeekCalendar events={events} />
        </div>
      )}
    </div>
  );
};

export default Schedule;
