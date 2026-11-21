import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginEditorial } from "@/components/auth/LoginEditorial";

export const metadata: Metadata = {
  title: "Prijava",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="login-page">
      <Suspense fallback={<p className="login-panel-lead">Nalagam…</p>}>
        <LoginEditorial />
      </Suspense>
    </main>
  );
}
