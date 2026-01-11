"use client";

import { useTechnicians } from "@/hooks/use-technicians";
import { TechnicianSidebarItem } from "./TechnicianSidebarItem";

export function TechnicianSidebar() {
  const { data: technicians } = useTechnicians();

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="w-full flex flex-col gap-2">
        {technicians?.map((technician) => (
          <TechnicianSidebarItem
            key={technician.id}
            id={technician.id}
            first_name={technician.first_name}
            last_name={technician.last_name}
            color={technician.color}
          />
        ))}
      </div>
    </div>
  );
}
