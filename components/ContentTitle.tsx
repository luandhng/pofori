"use client";

import { useTechnicians } from "@/hooks/use-technicians";
import { usePathname } from "next/navigation";
import { useBusiness } from "@/hooks/use-business"; // Assuming you have this

export const ContentTitle = () => {
  const pathname = usePathname();
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "Overview";

  // 1. Get the ID so keys match
  const { data: business } = useBusiness();

  // 2. This call is FREE (Instant, from cache)
  const { data: technicians } = useTechnicians(business?.id);

  // 3. Fancy Logic: If URL is an ID (like /technicians/123), show the Name instead!
  // We check if 'lastSegment' looks like a UUID or ID
  const activeTech = technicians?.find((t) => t.id === lastSegment);

  return (
    <div className="text-2xl font-medium">
      {/* If we found a tech with this ID, show their name. Otherwise show the URL text. */}
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
  );
};
