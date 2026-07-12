import type { Metadata } from "next";
import { Footer } from "@/components/footer/Footer";
import { PlaciloCheckout } from "@/components/checkout/PlaciloCheckout";

export const metadata: Metadata = {
  title: "Plačilo",
  description: "Varno plačilo Fortis Selection — Stripe.",
  robots: { index: false, follow: false },
};

export default function PlaciloPage() {
  return (
    <>
      <PlaciloCheckout />
      <Footer />
    </>
  );
}
