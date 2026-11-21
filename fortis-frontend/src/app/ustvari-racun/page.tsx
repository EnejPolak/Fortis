import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Ustvari račun",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <main className="shop-page">
      <Suspense fallback={<p className="shop-lead">Nalagam…</p>}>
        <AuthForm mode="register" />
      </Suspense>
    </main>
  );
}
