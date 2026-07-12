import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/footer/Footer";
import { VinoUspehContent } from "@/components/wine/VinoUspehContent";

export const metadata: Metadata = {
  title: "Nakup uspešen",
  description: "Hvala za nakup vina PRIMO pri Fortis Niche Atelier.",
  robots: { index: false, follow: false },
};

export default function VinoUspehPage() {
  return (
    <>
      <Suspense fallback={<main style={{ minHeight: "100vh", background: "#0f0f0f" }} />}>
        <VinoUspehContent />
      </Suspense>
      <Footer />
    </>
  );
}
