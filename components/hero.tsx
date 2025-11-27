const Hero = () => {
  return (
    <div className="max-w-5xl mx-auto py-20 flex flex-col gap-10 font-medium">
      <div className="flex flex-col gap-5 tracking-tight ">
        <h1 className="text-2xl">Build your portfolio in minutes.</h1>
        <h1 className="text-2xl leading-0">
          Pofori is standard way to build your portfolio.
        </h1>
      </div>

      <div>
        <button className="text-base cursor-pointer hover:bg-blue-600 animate duration-200 bg-black text-white rounded-full leading-0 py-5 px-7">
          Start your site
        </button>
      </div>

      <div className="bg-neutral-200 rounded-3xl w-full aspect-square"></div>
    </div>
  );
};

export default Hero;
