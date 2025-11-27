import { Button } from "./ui/button";

export const Navbar = () => {
  return (
    <div className="">
      <nav className="relative flex font-medium items-center justify-between py-4">
        <div className="flex gap-8 items-center">
          <h1 className="font-bold text-xl">Pofori</h1>
        </div>

        <div className="flex gap-8 absolute left-1/2 -translate-x-1/2">
          <a href="">Pricing</a>
          <a href="">Blog</a>
          <a href="">Changelog</a>
          <a href="">Help</a>
        </div>

        <div className="flex gap-4 items-center">
          <a href="">Log in</a>
          <Button text="Sign up" />
        </div>
      </nav>
    </div>
  );
};
