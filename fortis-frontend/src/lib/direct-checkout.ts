export const DIRECT_CHECKOUT_KEY = "fortis.checkout.direct.v1";

export type DirectCheckoutPayload = {
  items: { slug: string; quantity: number }[];
};

export function saveDirectCheckout(payload: DirectCheckoutPayload) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DIRECT_CHECKOUT_KEY, JSON.stringify(payload));
}

export function readDirectCheckout(): DirectCheckoutPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DIRECT_CHECKOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DirectCheckoutPayload;
    if (!Array.isArray(parsed.items) || !parsed.items.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDirectCheckout() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DIRECT_CHECKOUT_KEY);
}
