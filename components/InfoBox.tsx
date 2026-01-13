interface Props {
  text: string;
  number: number;
  money?: boolean;
}

export const InfoBox = ({ text, number, money }: Props) => {
  return (
    <div className="bg-neutral-800 p-6 rounded-2xl flex flex-col gap-6">
      <h2 className="">{text}</h2>
      <p className="text-2xl">
        {money && "$"} {number}
      </p>
    </div>
  );
};
