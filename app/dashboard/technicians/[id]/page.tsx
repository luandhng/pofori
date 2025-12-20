import { InfoBox } from "@/components/InfoBox";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Technician = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-3 gap-8">
        <InfoBox text="Total Appointments" />
        <InfoBox text="Completed" />
        <InfoBox text="Total Revenue" />
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-[#fafafa]">
            <TableRow>
              <TableHead className="px-6 py-4">Customer</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="px-6 py-4">Earn</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="">
              <TableCell className="font-medium p-6">Steven King</TableCell>
              <TableCell>Hair Cut, Nail Art, Manicure</TableCell>
              <TableCell>05/21/25</TableCell>
              <TableCell>$50.00</TableCell>
              <TableCell>Done</TableCell>
            </TableRow>

            <TableRow className="bg-red-50">
              <TableCell className="font-medium p-6">INV001</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Credit Card</TableCell>
              <TableCell>$250.00</TableCell>
              <TableCell>Cancelled</TableCell>
            </TableRow>

            <TableRow className="">
              <TableCell className="font-medium p-6">INV001</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Credit Card</TableCell>
              <TableCell>$250.00</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>

            <TableRow className="">
              <TableCell className="font-medium p-6">INV001</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Credit Card</TableCell>
              <TableCell>$250.00</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Technician;
