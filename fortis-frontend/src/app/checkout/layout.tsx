import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blagajna",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="checkout-route">{children}</div>;
}
