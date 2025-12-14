export const Hero = () => {
  return (
    <div className="py-24 flex flex-col gap-12">
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl max-w-lg">
          Designed to make you look professional, Pofori is the best way to
          share your work.
        </h1>
        <button className="bg-black px-6 py-2.5 w-fit text-base text-white rounded-full">
          Create my portfolio
        </button>
      </div>

      <div className="h-screen overflow-hidden">
        <img src="img/artex.jpg" alt="art" className="rounded-2xl" />
      </div>
    </div>
  );
};
