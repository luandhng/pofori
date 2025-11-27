import { FeaturesBox } from "./features-box";

export const Features = () => {
  return (
    <div className="flex flex-col gap-6 pt-24">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-medium max-w-lg tracking-tight">
          Designed for artist
        </h2>
        <h2 className="max-w-md text-neutral-600">
          Whether you are an artist or a video maker, Pofori is the best place
          for your portfolio. We make it easy for clients to find and view your
          work.
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <FeaturesBox
          title="Fast Loading"
          desc="Fast, modern mobile and desktop apps that work offline"
        />
        <FeaturesBox
          title="Private by design"
          desc="Stored on your device and syncs with end-to-end encryption"
        />
        <FeaturesBox
          title="Private by design"
          desc="Stored on your device and syncs with end-to-end encryption"
        />{" "}
        <FeaturesBox
          title="Private by design"
          desc="Stored on your device and syncs with end-to-end encryption"
        />{" "}
        <FeaturesBox
          title="Private by design"
          desc="Stored on your device and syncs with end-to-end encryption"
        />{" "}
        <FeaturesBox
          title="Private by design"
          desc="Stored on your device and syncs with end-to-end encryption"
        />
      </div>
    </div>
  );
};
