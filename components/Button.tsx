interface Props {
  text: string;
  icon: any;
}

export const Button = ({ text, icon }: Props) => {
  return (
    <button className="hover:bg-white flex items-center gap-2 border cursor-pointer hover:border-neutral-200 border-transparent py-2 px-3 text-left rounded-md">
      {icon} <p>{text}</p>
    </button>
  );
};
