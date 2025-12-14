import { Hero } from "@/components/landing-page/Hero";
import { Nav } from "@/components/landing-page/Nav";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <Nav />
      <Hero />
    </div>
  );
}
