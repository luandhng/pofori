"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  text: string;
  icon: any;
}

export const Button = ({ text, icon }: Props) => {
  const pathname = usePathname();
  const lastSegment = pathname.split("/").filter(Boolean).pop();
  const lowerCaseText = text.toLowerCase();
  const linkHref = `${lowerCaseText.replace(" ", "")}`;

  const isActive = lastSegment === linkHref;

  return (
    <Link
      href={linkHref}
      className={` ${
        isActive
          ? "bg-lime-200"
          : "duration-200 text-neutral-500 hover:text-black"
      } flex items-center gap-2.5 cursor-pointer w-full py-1.5 px-2 text-left rounded-md`}
    >
      {icon} <p>{text}</p>
    </Link>
  );
};
