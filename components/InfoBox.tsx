interface Props {
  text: string;
}

export const InfoBox = ({ text }: Props) => {
  return (
    <div className="bg-[#fafafa] p-6 border border-neutral-200 rounded-xl flex flex-col gap-4">
      <h2 className="">{text}</h2>
      <p className="text-2xl">$12</p>
    </div>
  );
};
