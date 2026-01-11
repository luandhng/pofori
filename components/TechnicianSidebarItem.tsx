import Link from "next/link";
import { Checkbox } from "./ui/checkbox";

interface TechnicianSidebarItemProps {
  first_name: string;
  last_name: string;
  id: string;
  color: "red" | "blue" | "green" | "yellow" | "orange" | "purple" | "pink";
}

export function TechnicianSidebarItem({
  first_name,
  last_name,
  id,
  color,
}: TechnicianSidebarItemProps) {
  return (
    <Link
      href={"/dashboard/technicians/" + id}
      className={`
      flex items-center hover:bg-slate-100 gap-2.5 cursor-pointer w-full py-1.5 px-2 text-left rounded-md`}
    >
      <Checkbox
        checked={true}
        className={`${
          color === "red" &&
          "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
        } ${
          color === "blue" &&
          "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
        } ${
          color === "green" &&
          "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
        } ${
          color === "yellow" &&
          "data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
        } ${
          color === "orange" &&
          "data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
        } ${
          color === "purple" &&
          "data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
        } ${
          color === "pink" &&
          "data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
        }`}
      />
      <p>
        {first_name.charAt(0).toUpperCase() + first_name.slice(1)}{" "}
        {last_name.charAt(0).toUpperCase() + last_name.slice(1)}
      </p>
    </Link>
  );
}
