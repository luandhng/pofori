"use client";

import { useAppointments } from "@/hooks/use-appointments";

const Schedule = () => {
  const { data, isLoading } = useAppointments();

  return (
    <div>
      <h2>Tuesday, December 2, 2025</h2>
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
