export const Hero = () => {
  return (
    <div className="py-28 flex flex-col gap-16">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl max-w-xl">
          Built to make you extraordinarily productive, Cursor is the best way
          to code with AI.
        </h1>
        <button className="bg-black w-fit text-white text-base py-2 px-6 rounded-full">
          Start my site
        </button>
      </div>

      <div className="w-full bg-[url(/web/hero.jpg)] p-20 overflow-hidden bg-cover h-180 rounded-md">
        <img src="/web/dashboard.webp" alt="" className="rounded-md" />
      </div>
    </div>
  );
};
