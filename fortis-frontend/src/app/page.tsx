import { HeroReveal } from "@/components/hero/HeroReveal";
import { Introduction } from "@/components/introduction/Introduction";
import { PerfumesBrands } from "@/components/perfumesbrands/PerfumesBrands";
import { Footer } from "@/components/footer/Footer";

export default function Home() {
  return (
    <>
      <div className="site-content">
        <HeroReveal />
        <Introduction />
        <PerfumesBrands />
      </div>
      <Footer />
    </>
  );
}
