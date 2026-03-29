import type { Metadata } from "next";
import { ContactJsonLd } from "@/components/seo/ContactJsonLd";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontakt Fortis Niche Atelier – nišna parfumerija v Ljubljani. Piši nam ali nas obišči.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Kontakt | Fortis Niche Atelier",
    description:
      "Kontakt Fortis Niche Atelier – nišna parfumerija v Ljubljani. Piši nam ali nas obišči.",
    url: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ContactJsonLd />
      {children}
    </>
  );
}
