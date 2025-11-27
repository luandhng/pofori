import { Features } from "@/components/features";
import Hero from "@/components/hero";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto">
      <Navbar />
      <Hero />
      <Features />
    </div>
  );
}
