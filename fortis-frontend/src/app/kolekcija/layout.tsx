import type { Metadata } from "next";
import { KolekcijaJsonLd } from "@/components/seo/KolekcijaJsonLd";

export const metadata: Metadata = {
  title: "Kolekcija",
  description:
    "Kolekcija nišnih parfumov v Fortis Niche Atelier, Ljubljana. Prebrskaj znamke in dišave.",
  alternates: { canonical: "/kolekcija" },
  openGraph: {
    title: "Kolekcija | Fortis Niche Atelier",
    description:
      "Kolekcija nišnih parfumov v Fortis Niche Atelier, Ljubljana. Prebrskaj znamke in dišave.",
    url: "/kolekcija",
  },
};

export default function KolekcijaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <KolekcijaJsonLd />
      {children}
    </>
  );
}
