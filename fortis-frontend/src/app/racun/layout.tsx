import type { Metadata } from "next";
import { AccountNav } from "@/components/account/AccountNav";

export const metadata: Metadata = {
  title: "Račun",
  robots: { index: false, follow: false },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="shop-page">
      <div className="shop-shell">
        <h1 className="shop-title">Račun</h1>
        <AccountNav />
        {children}
      </div>
    </main>
  );
}
