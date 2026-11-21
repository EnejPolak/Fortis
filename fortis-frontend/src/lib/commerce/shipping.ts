/**
 * Fulfillment options.
 * Delivery rates are not configured yet — only atelier pickup is offered.
 * Set NEXT_PUBLIC_DELIVERY_CENTS when business provides a flat rate.
 */

import { ATELIER_ADDRESS_LINE } from "@/lib/commerce/atelier";

export type FulfillmentMethod = "pickup" | "delivery";

export type FulfillmentOption = {
  id: FulfillmentMethod;
  label: string;
  description: string;
  cents: number;
  available: boolean;
  unavailableReason?: string;
};

function readDeliveryCents(): number | null {
  const raw = process.env.NEXT_PUBLIC_DELIVERY_CENTS?.trim();
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function getFulfillmentOptions(): FulfillmentOption[] {
  const deliveryCents = readDeliveryCents();

  const pickup: FulfillmentOption = {
    id: "pickup",
    label: "Osebni prevzem",
    description: ATELIER_ADDRESS_LINE,
    cents: 0,
    available: true,
  };

  const delivery: FulfillmentOption = {
    id: "delivery",
    label: "Dostava",
    description:
      deliveryCents != null
        ? "Dostava na naslov v Sloveniji."
        : "Dostava trenutno ni na voljo.",
    cents: deliveryCents ?? 0,
    available: deliveryCents != null,
    unavailableReason:
      deliveryCents == null ? "Dostava trenutno ni na voljo." : undefined,
  };

  return [pickup, delivery];
}

export function getFulfillmentOption(id: FulfillmentMethod): FulfillmentOption | null {
  return getFulfillmentOptions().find((o) => o.id === id) ?? null;
}
