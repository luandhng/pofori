"use client";

import { useTechnicians } from "@/hooks/use-technicians";
import { usePathname } from "next/navigation";

import { SheetTechnician } from "./SheetTechnician";

export const ContentTitle = () => {
  const pathname = usePathname();
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "Overview";

  const { data: technicians } = useTechnicians();

  const activeTech = technicians?.find((t) => t.id === lastSegment);

  return (
    <div className="flex items-center justify-between">
      <div className="text-2xl font-medium">
        {activeTech
          ? `${
              activeTech.first_name.slice(0, 1).toUpperCase() +
              activeTech.first_name.slice(1)
            } ${
              activeTech.last_name.slice(0, 1).toUpperCase() +
              activeTech.last_name.slice(1)
            }`
          : lastSegment.slice(0, 1).toUpperCase() +
            lastSegment.slice(1).toLowerCase()}
      </div>

      {activeTech && <SheetTechnician activeTech={activeTech} />}
    </div>
  );
};
