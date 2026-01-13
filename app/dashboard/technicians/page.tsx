"use client";

import { useState } from "react"; // 1. Import useState
import { InfoBox } from "@/components/InfoBox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  // Note: We don't need SheetTrigger anymore
} from "@/components/ui/sheet";
import { useTechnicians } from "@/hooks/use-technicians";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";

const Technicians = () => {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data: technicians } = useTechnicians();

  // 2. Add state to track which tech is clicked and if sheet is open
  const [open, setOpen] = useState(false);
  const [activeTech, setActiveTech] = useState<any>(null); // Replace 'any' with your Technician type if available

  // 3. Handler to open sheet
  const handleRowClick = (tech: any) => {
    setActiveTech(tech);
    setOpen(true);
  };

  return (
    <div className="p-10 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl">Technicians</h1>
        <button className="bg-neutral-800 text-white px-4 py-2 rounded-md">
          Add Technician
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <InfoBox text="Total Technicians" number={technicians?.length || 0} />
        <InfoBox
          text="Currently active technicians"
          number={
            technicians?.filter((tech) => tech.status === "active")?.length || 0
          }
        />
        <InfoBox text="Total Revenue" number={0} />
      </div>

      <div className="border rounded-xl overflow-hidden borderColor">
        <Table>
          <TableHeader>
            <TableRow className="borderColor hover:bg-transparent">
              <TableHead className="p-6 text-white">Name</TableHead>
              <TableHead className="text-white">Services</TableHead>
              <TableHead className="text-white">Rate</TableHead>
              <TableHead className="text-white">Earn</TableHead>
              <TableHead className="text-white">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {technicians?.map(
              (item) =>
                item.technician_id === id && (
                  <TableRow
                    key={item.id}
                    className="borderColor cursor-pointer hover:bg-neutral-800/50 transition-colors" // Added cursor-pointer and hover effect
                    onClick={() => handleRowClick(item)} // 4. Attach click handler here
                  >
                    <TableCell className="font-medium p-6">
                      {item.first_name} {item.last_name}
                    </TableCell>
                    <TableCell className="flex gap-2 py-6">Haircut</TableCell>
                    <TableCell>60%</TableCell>
                    <TableCell>$0.00</TableCell>
                    <TableCell
                      className={`${
                        item.status === "active"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {item.status}
                    </TableCell>
                  </TableRow>
                )
            )}
          </TableBody>
        </Table>
      </div>

      {/* 5. Render the Sheet outside the table, controlled by state */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="bg-neutral-800 w-200 borderColor">
          <SheetHeader className="hidden">
            <SheetTitle className="text-white hidden"></SheetTitle>
            <SheetDescription className="text-white hidden"></SheetDescription>
          </SheetHeader>

          {/* Safe check to ensure we have data before rendering form */}
          {activeTech && (
            <div className="flex flex-col gap-4 p-6">
              <div className="h-20 w-20 rounded-full bg-neutral-500"></div>
              <div className="flex gap-4">
                <Input
                  onChange={() => {}}
                  className="borderColor"
                  placeholder="First Name"
                  value={activeTech.first_name}
                />
                <Input
                  onChange={() => {}}
                  className="borderColor"
                  placeholder="Last Name"
                  value={activeTech.last_name}
                />
              </div>

              <div className="flex flex-col gap-4">
                <Input
                  onChange={() => {}}
                  className="borderColor"
                  placeholder="Email"
                  value={activeTech.email}
                />
                <Input
                  onChange={() => {}}
                  type="tel"
                  className="borderColor"
                  placeholder="Phone"
                  value={activeTech.phone_number}
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Technicians;
