export const Nav = () => {
  return (
    <nav className="flex justify-between items-center relative py-4">
      <h1 className="">Pofori</h1>

      <div className="absolute flex gap-8 left-1/2 -translate-x-1/2">
        <a href="">Pricing</a>
        <a href="">Blog</a>
        <a href="">Changelog</a>
        <a href="">Help</a>
      </div>

      <div className="flex gap-4">
        <button>Log in</button>
        <button className="bg-black text-white px-3 py-1 rounded-full">
          Sign up
        </button>
      </div>
    </nav>
  );
};
