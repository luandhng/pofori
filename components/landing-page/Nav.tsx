import Link from "next/link";

export const Nav = () => {
  return (
    <nav className="sticky top-0 flex items-center justify-between py-3 bg-white">
      <h1 className="font-semibold text-base tracking-tight">POFORI</h1>

      <div className="flex gap-10">
        <Link href={""}>Pricing</Link>
        <Link href={""}>Features</Link>
        <Link href={""}>Guide</Link>
      </div>

      <div>
        <button className="bg-black px-3 py-1 text-white rounded-full">
          Sign up
        </button>
      </div>
    </nav>
  );
};
