import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { isStripeConfigured, isStripeTestMode } from "@/lib/stripe";

type Props = {
  searchParams: Promise<{ cancelled?: string }>;
};

export default async function CheckoutPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <CheckoutForm
      cancelled={params.cancelled === "1"}
      stripeReady={isStripeConfigured()}
      testMode={isStripeConfigured() && isStripeTestMode()}
    />
  );
}
