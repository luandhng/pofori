"use client";

import { InfoBox } from "@/components/InfoBox";

import { toZonedTime, format } from "date-fns-tz";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppointments } from "@/hooks/use-appointments";
import { useCustomers } from "@/hooks/use-customers";
import { useParams } from "next/navigation";
import { TechnicianInfo } from "@/components/TechnicianInfo";

const Technician = () => {
  const { data: appointments } = useAppointments();
  const { data: customers } = useCustomers();

  const params = useParams();
  // Extract id and ensure it's a string (not an array)
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const getAppointmentCount = () => {
    if (!appointments) return 0;
    return appointments.filter((appt) => appt.technician_id === id).length;
  };

  const getCustomerName = (customerId: string) => {
    const found = customers?.find((c) => c.id === customerId);

    return found
      ? `${found.first_name} ${found.last_name || ""}`
      : "Unknown Customer";
  };

  const formatBusinessTime = (isoString: string) => {
    const timeZone = "est";
    const zonedDate = toZonedTime(isoString, timeZone);

    return format(zonedDate, "MMM d yy, h:mm a", { timeZone });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="">
        <TechnicianInfo technicianId={id} />

        <div className="grid grid-cols-4 gap-4 p-4">
          <InfoBox text="Total Appointments" number={getAppointmentCount()} />
          <InfoBox text="Completed" number={0} />
          <InfoBox money text="Total Revenue" number={0} />
          <InfoBox money text="Total Revenue" number={0} />
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden hidden">
        <Table>
          <TableHeader className="bg-[#fafafa]">
            <TableRow>
              <TableHead className="px-6 py-4">Customer</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Earn</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments?.map(
              (item) =>
                item.technician_id === id && (
                  <TableRow key={item.id} className="">
                    <TableCell className="font-medium p-6">
                      {getCustomerName(item.customer_id)}
                    </TableCell>
                    <TableCell className="flex gap-2 py-6">
                      {item.services.map((item: string, index: number) => (
                        <div
                          className="border lowercase border-neutral-200 rounded-full py-1 px-2 w-fit"
                          key={index}
                        >
                          {item}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>{formatBusinessTime(item.time)}</TableCell>
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
    </div>
  );
};

export default Technician;
