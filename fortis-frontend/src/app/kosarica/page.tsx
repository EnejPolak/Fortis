import type { Metadata } from "next";
import { Footer } from "@/components/footer/Footer";
import { CartPage } from "@/components/cart/CartPage";

export const metadata: Metadata = {
  title: "Košarica",
  description: "Košarica Fortis Selection — vino PRIMO.",
  robots: { index: false, follow: false },
};

export default function KosaricaPage() {
  return (
    <>
      <CartPage />
      <Footer />
    </>
  );
}
