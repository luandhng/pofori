"use client";

import { MainCalendar } from "@/components/MainCalendar";
import { useAppointments } from "@/hooks/use-appointments";

const Schedule = () => {
  const { data: appointments, isLoading } = useAppointments();

  return (
    <div className="h-full">
      {isLoading ? (
        "Loading.."
      ) : (
        <div className="h-full">
          {/* {data?.map((item: any, index: number) => (
            <div key={index}>{item.time}</div>
          ))} */}
          <MainCalendar events={appointments || []} />
        </div>
      )}
    </div>
  );
};

export default Schedule;
