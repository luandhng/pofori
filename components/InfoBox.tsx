interface Props {
  text: string;
  number: number;
  money?: boolean;
}

export const InfoBox = ({ text, number, money }: Props) => {
  return (
    <div className="bg-[#fafafa] p-6 border border-neutral-200 rounded-xl flex flex-col gap-4">
      <h2 className="">{text}</h2>
      <p className="text-2xl">
        {money && "$"} {number}
      </p>
    </div>
  );
};
