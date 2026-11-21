import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { isStripeConfigured, isStripeTestMode } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Blagajna",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ cancelled?: string }>;
};

export default async function CheckoutPage({ searchParams }: Props) {
  const params = await searchParams;
  const stripeReady = isStripeConfigured();

  return (
    <main className="shop-page">
      <div className="shop-shell">
        <h1 className="shop-title">Blagajna</h1>
        <p className="shop-lead">
          Naročilo lahko zaključite kot gost. Račun ni obvezen.
        </p>
        {!stripeReady ? (
          <div className="shop-banner shop-banner--error" role="status">
            Plačilna povezava še ni aktivna. Košarico lahko uporabljate, blagajna
            pa zahteva veljavne Stripe poverilnice.
          </div>
        ) : isStripeTestMode() ? (
          <div className="shop-banner" role="status">
            Testni način plačil (Stripe test). Dejanskih zneskov se ne zaračuna.
          </div>
        ) : null}
        <CheckoutForm cancelled={params.cancelled === "1"} />
      </div>
    </main>
  );
}
