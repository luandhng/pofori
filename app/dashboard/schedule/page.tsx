"use client";

import { useAppointments } from "@/hooks/use-appointments";
import { useBusiness } from "@/hooks/use-business";

const Schedule = () => {
  const { data, isLoading } = useAppointments();

  return (
    <div>
      {isLoading ? (
        "Loading.."
      ) : (
        <div>
          {data?.map((item: any, index: number) => (
            <div key={index}>{item.time}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schedule;
