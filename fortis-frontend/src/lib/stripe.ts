import Stripe from "stripe";

let stripe: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (stripe !== undefined) return stripe;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || key.includes("...")) {
    stripe = null;
    return stripe;
  }
  stripe = new Stripe(key, {
    apiVersion: "2026-11-18.endive",
    typescript: true,
  });
  return stripe;
}

export function isStripeConfigured(): boolean {
  return getStripe() != null;
}

export function isStripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  return key.startsWith("sk_test_");
}
