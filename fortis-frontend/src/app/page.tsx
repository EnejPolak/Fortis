import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroReveal } from "@/components/hero/HeroReveal";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};
import { Introduction } from "@/components/introduction/Introduction";
import { PerfumesBrands } from "@/components/perfumesbrands/PerfumesBrands";
import { Footer } from "@/components/footer/Footer";

export default function Home() {
  return (
    <>
      <div className="site-content">
        <Suspense fallback={<div style={{ minHeight: "100svh" }} />}>
          <HeroReveal />
        </Suspense>
        <Introduction />
        <PerfumesBrands />
      </div>
      <Footer />
    </>
  );
}
