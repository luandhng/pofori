interface Props {
  text: string;
}

export const Button = ({ text }: Props) => {
  return (
    <button className="py-3.5 px-3 rounded-full text-white leading-0 bg-black">
      {text}
    </button>
  );
};
