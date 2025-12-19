import Link from "next/link";

interface Props {
  text: string;
  icon: any;
  active?: boolean;
}

export const Button = ({ text, icon, active }: Props) => {
  return (
    <Link
      href={text.toLowerCase().replace(" ", "")}
      className={` ${
        active
          ? "bg-white border-neutral-200"
          : "hover:bg-white text-neutral-500 hover:text-black hover:border-neutral-200 border-transparent"
      } flex items-center gap-2 border cursor-pointer w-full hover:border-neutral-200  py-1.5 px-2.5 text-left rounded-md`}
    >
      {icon} <p>{text}</p>
    </Link>
  );
};
