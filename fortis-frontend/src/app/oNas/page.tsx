import type { Metadata } from "next";
import ONas from "@/components/oNas";
import { Footer } from "@/components/footer/Footer";

export const metadata: Metadata = {
  title: "O nas",
  description:
    "Spoznaj Fortis Niche Atelier – našo zgodbo, vizijo in ljubezen do nišne parfumerije v Ljubljani.",
  alternates: { canonical: "/oNas" },
  openGraph: {
    title: "O nas | Fortis Niche Atelier",
    description:
      "Spoznaj Fortis Niche Atelier – našo zgodbo, vizijo in ljubezen do nišne parfumerije v Ljubljani.",
    url: "/oNas",
  },
};

export default function ONasPage() {
  return (
    <>
      <ONas />
      <Footer />
    </>
  );
}
