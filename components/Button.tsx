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
          ? "bg-white border-neutral-200"
          : "hover:bg-white duration-200 text-neutral-500 hover:text-black hover:border-neutral-200 border-transparent"
      } flex items-center gap-1.5 border cursor-pointer w-full hover:border-neutral-200  py-1 px-2 text-left rounded-md`}
    >
      {icon} <p>{text}</p>
    </Link>
  );
};
