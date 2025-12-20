"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBusiness } from "@/hooks/use-business";
import { useTechnicians } from "@/hooks/use-technicians";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

const Technicians = () => {
  const { data: business } = useBusiness();
  const { data } = useTechnicians(business?.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex gap-6 w-56">
          <Input placeholder="Search technician" type="search" />
        </div>

        <Button className="">
          <PlusIcon />
          New Technician
        </Button>
      </div>

      <div className="border border-neutral-200 overflow-hidden rounded-xl">
        {data?.map((item, index) => (
          <Link
            href={`technicians/${item.id}`}
            key={index}
            className="border-b flex items-center justify-between hover:bg-neutral-100 cursor-pointer border-neutral-200 last:border-none px-6 py-4"
          >
            <div className="flex items-center gap-4">
              <div className="bg-neutral-200 h-10 w-10 rounded-lg"></div>
              <div className="">
                {item.first_name.toUpperCase().slice(0, 1) +
                  item.first_name.slice(1)}{" "}
                {item.last_name.toUpperCase().slice(0, 1) +
                  item.last_name.slice(1)}
              </div>
            </div>

            <div>60% Commission</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Technicians;
