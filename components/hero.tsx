const Hero = () => {
  return (
    <div className="pt-10 flex flex-col gap-10 font-medium">
      <div className="flex flex-col gap-5 tracking-tight ">
        <h1 className="text-2xl">Portfolio for artists.</h1>
        <h1 className="text-2xl leading-0">
          Pofori is best way to showcase your works.
        </h1>
      </div>

      <div>
        <button className="text-base cursor-pointer hover:bg-blue-600 animate duration-200 bg-black text-white rounded-full leading-0 py-5 px-7">
          Start your site
        </button>
        <button className="text-base cursor-pointer rounded-full leading-0 py-5 px-7">
          View examples
        </button>
      </div>

      <div className="bg-neutral-200 rounded-3xl w-full aspect-square"></div>
    </div>
  );
};

export default Hero;
