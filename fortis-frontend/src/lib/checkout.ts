import type Stripe from "stripe";
import { getWineBySlug } from "@/data/wine";
import { toAbsoluteUrl } from "@/lib/site";

export type CheckoutItem = {
  slug: string;
  quantity: number;
};

const MAX_PER_LINE = 12;

/** Fiksna poštnina v centih (5,00 €) — prilagodi po potrebi. */
export const SHIPPING_CENTS = 500;

export type DeliveryMethod = "pickup" | "delivery";

export const PICKUP_LOCATION = {
  line1: "Poljanska cesta 7",
  city: "Ljubljana",
  postalCode: "1000",
  country: "SI",
} as const;

export function parseDeliveryMethod(body: unknown): DeliveryMethod {
  if (!body || typeof body !== "object") return "delivery";
  const method = (body as Record<string, unknown>).deliveryMethod;
  return method === "pickup" ? "pickup" : "delivery";
}

export function parseCheckoutItems(body: unknown): CheckoutItem[] | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;

  if (Array.isArray(record.items)) {
    const items: CheckoutItem[] = [];
    for (const raw of record.items) {
      if (!raw || typeof raw !== "object") continue;
      const row = raw as Record<string, unknown>;
      const slug = typeof row.slug === "string" ? row.slug : "";
      const quantity =
        typeof row.quantity === "number" ? Math.floor(row.quantity) : 0;
      if (!slug || quantity < 1) continue;
      items.push({ slug, quantity: Math.min(quantity, MAX_PER_LINE) });
    }
    return items.length ? items : null;
  }

  const slug = typeof record.slug === "string" ? record.slug : "";
  const quantity =
    typeof record.quantity === "number" ? Math.floor(record.quantity) : 1;
  if (!slug) return null;
  return [{ slug, quantity: Math.min(Math.max(1, quantity), MAX_PER_LINE) }];
}

export function buildStripeLineItems(
  items: CheckoutItem[]
): Stripe.Checkout.SessionCreateParams.LineItem[] | null {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const { slug, quantity } of items) {
    const wine = getWineBySlug(slug);
    if (!wine) return null;

    lineItems.push({
      quantity,
      price_data: {
        currency: wine.currency,
        unit_amount: wine.priceCents,
        product_data: {
          name: `${wine.name} ${wine.vintage}`,
          description: wine.tagline,
          images: [toAbsoluteUrl(wine.imageSrc)],
        },
      },
    });
  }

  return lineItems.length ? lineItems : null;
}

export function checkoutMetadata(
  items: CheckoutItem[],
  deliveryMethod: DeliveryMethod
): Record<string, string> {
  const shippingCents = deliveryMethod === "pickup" ? 0 : SHIPPING_CENTS;
  return {
    wine_slugs: items.map((i) => i.slug).join(","),
    wine_qty: items.map((i) => String(i.quantity)).join(","),
    item_count: String(items.reduce((s, i) => s + i.quantity, 0)),
    fulfillment: deliveryMethod,
    shipping_cents: String(shippingCents),
  };
}

export type OrderLine = {
  slug: string;
  quantity: number;
  name: string;
  vintage: string;
  unitCents: number;
  lineCents: number;
};

export function buildOrderSummary(
  items: CheckoutItem[],
  deliveryMethod: DeliveryMethod = "delivery"
): {
  lines: OrderLine[];
  netSubtotalCents: number;
  vatSubtotalCents: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  deliveryMethod: DeliveryMethod;
} | null {
  const lines: OrderLine[] = [];
  let netSubtotalCents = 0;
  let vatSubtotalCents = 0;
  let subtotalCents = 0;
  let currency = "eur";

  for (const item of items) {
    const wine = getWineBySlug(item.slug);
    if (!wine) return null;
    const lineCents = wine.priceCents * item.quantity;
    lines.push({
      slug: item.slug,
      quantity: item.quantity,
      name: wine.name,
      vintage: wine.vintage,
      unitCents: wine.priceCents,
      lineCents,
    });
    netSubtotalCents += wine.priceNetCents * item.quantity;
    vatSubtotalCents += wine.vatCents * item.quantity;
    subtotalCents += lineCents;
    currency = wine.currency;
  }

  if (!lines.length || subtotalCents < 50) return null;

  const shippingCents = deliveryMethod === "pickup" ? 0 : SHIPPING_CENTS;

  return {
    lines,
    netSubtotalCents,
    vatSubtotalCents,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    currency,
    deliveryMethod,
  };
}
