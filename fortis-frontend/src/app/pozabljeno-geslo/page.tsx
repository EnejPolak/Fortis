import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Pozabljeno geslo",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="shop-page">
      <Suspense fallback={<p className="shop-lead">Nalagam…</p>}>
        <AuthForm mode="forgot" />
      </Suspense>
    </main>
  );
}
