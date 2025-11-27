const Hero = () => {
  return (
    <div className="max-w-5xl mx-auto py-20 flex flex-col gap-6 font-medium">
      <div className="flex flex-col gap-1 tracking-tight">
        <h1 className="text-2xl">Build your portfolio in minutes.</h1>
        <h1 className="text-2xl">Pofori is standard way for your portfolio.</h1>
      </div>

      <div>
        <button className="text-base cursor-pointer bg-black text-white rounded-full leading-0 py-5 px-7">
          Start your site
        </button>
      </div>
    </div>
  );
};

export default Hero;
