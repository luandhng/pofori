"use client";

import { useTechnicians } from "@/hooks/use-technicians";
import { TechnicianSidebarItem } from "./TechnicianSidebarItem";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { PlusIcon, UserGearIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useParams } from "next/navigation";

export function TechnicianSidebar() {
  const { data } = useTechnicians();

  const params = useParams();

  return (
    <div className="flex flex-col border-r-[0.5px] borderColor h-full">
      <div className="flex items-center gap-2 justify-between border-b-[0.5px] p-2 borderColor">
        <Input
          placeholder="Search a technician"
          className="borderColor"
          type="search"
        />
      </div>

      <div className="overflow-hidden h-full p-2 flex flex-col gap-2">
        <div className=" text-neutral-500 text-center border borderColor p-2 cursor-pointer rounded-sm border-dashed flex justify-center items-center gap-1">
          <PlusIcon size={14} /> <p>Add a technician</p>
        </div>
        {data?.map((item, index) => (
          <Link
            href={`/dashboard/technicians/${item.id}`}
            key={index}
            className={`flex items-center py-2 px-2.5 gap-3 hover:text-white rounded-sm hover:bg-neutral-800 cursor-pointer ${
              params.id === item.id ? "bg-neutral-800" : "text-neutral-500"
            }`}
          >
            <UserGearIcon size={16} />
            <div className="">
              {item.first_name.toUpperCase().slice(0, 1) +
                item.first_name.slice(1)}{" "}
              {item.last_name.toUpperCase().slice(0, 1) +
                item.last_name.slice(1)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
