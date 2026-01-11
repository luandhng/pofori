"use client";

import { useTechnicians } from "@/hooks/use-technicians";
import { TechnicianSidebarItem } from "./TechnicianSidebarItem";

export function TechnicianSidebar() {
  const { data: technicians } = useTechnicians();

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="px-2 text-xs text-neutral-500 font-medium">Technicians</p>
      <div className="w-full flex flex-col gap-1">
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
