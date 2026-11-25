export type FulfillmentStatus =
  | "unfulfilled"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled";

const ALLOWED: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  unfulfilled: ["ready", "shipped", "cancelled"],
  ready: ["shipped", "delivered", "cancelled", "unfulfilled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function canTransitionFulfillment(
  from: string,
  to: string
): to is FulfillmentStatus {
  const allowed = ALLOWED[from as FulfillmentStatus];
  if (!allowed) return false;
  return allowed.includes(to as FulfillmentStatus);
}

export function fulfillmentLabelSl(status: string): string {
  const map: Record<string, string> = {
    unfulfilled: "Neizpolnjeno",
    ready: "Pripravljeno za prevzem",
    shipped: "Odposlano",
    delivered: "Zaključeno",
    cancelled: "Preklicano",
  };
  return map[status] ?? status;
}
