import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Prijava",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="shop-page">
      <Suspense fallback={<p className="shop-lead">Nalagam…</p>}>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
