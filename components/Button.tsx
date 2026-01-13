"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  text: string;
  icon: any;
}

export const Button = ({ text, icon }: Props) => {
  const pathname = usePathname();

  const lowerCaseText = text.toLowerCase().replace(" ", "");
  const targetPath = `/dashboard/${lowerCaseText}`;

  const isActive =
    pathname === targetPath || pathname.startsWith(`${targetPath}/`);

  return (
    <Link
      href={targetPath}
      className={` ${
        isActive
          ? "bg-neutral-800"
          : "duration-100 text-neutral-500 hover:text-white hover:bg-neutral-800"
      } flex items-center gap-3 cursor-pointer w-full py-2 px-3 text-left rounded-sm`}
    >
      {icon} <p>{text}</p>
    </Link>
  );
};
