import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SecurityPage() {
  return (
    <div>
      <p className="shop-lead">
        Za spremembo gesla uporabite obrazec spodaj (po povezavi iz e-pošte) ali
        zahtevajte novo povezavo.
      </p>
      <Suspense fallback={<p className="shop-lead">Nalagam…</p>}>
        <AuthForm mode="reset" />
      </Suspense>
    </div>
  );
}
