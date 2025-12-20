"use client";

import { usePathname } from "next/navigation";

export const ContentTitle = () => {
  const pathname = usePathname();
  const lastSegment = pathname.split("/").filter(Boolean).pop();

  return (
    <div className="text-2xl font-medium">
      {lastSegment?.slice(0, 1).toUpperCase() +
        lastSegment?.slice(1).toLowerCase()}
    </div>
  );
};
