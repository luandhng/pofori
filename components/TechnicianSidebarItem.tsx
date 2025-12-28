import Link from "next/link";
import { Checkbox } from "./ui/checkbox";

interface TechnicianSidebarItemProps {
  first_name: string;
  last_name: string;
  color: "red" | "blue" | "green" | "yellow" | "orange" | "purple" | "pink";
}

export function TechnicianSidebarItem({
  first_name,
  last_name,
  color,
}: TechnicianSidebarItemProps) {
  return (
    <Link
      href={""}
      className={`
      flex items-center hover:bg-slate-100 gap-2.5 cursor-pointer w-full py-1.5 px-2 text-left rounded-md`}
    >
      <Checkbox
        checked={true}
        className={`data-[state=checked]:bg-${color}-500 data-[state=checked]:border-${color}-500`}
      />
      <p>
        {first_name} {last_name}
      </p>
    </Link>
  );
}
