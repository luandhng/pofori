import { CameraIcon } from "@phosphor-icons/react/ssr";

interface Props {
  title: string;
  desc: string;
}

export const FeaturesBox = ({ title, desc }: Props) => {
  return (
    <div className="bg-white border shadow-xs border-neutral-200 p-4 flex flex-col justify-between h-52 rounded-3xl">
      <div>
        {/* <PenNibIcon weight="regular" size={28} /> */}
        <CameraIcon weight="regular" size={24} />
      </div>

      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  );
};
