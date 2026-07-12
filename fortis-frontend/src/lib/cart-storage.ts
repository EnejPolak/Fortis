export type CartLine = {
  slug: string;
  quantity: number;
};

export type CartState = {
  items: CartLine[];
};

const STORAGE_KEY = "fortis.cart.v1";

export function readCart(): CartState {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as CartState;
    if (!Array.isArray(parsed.items)) return { items: [] };
    return {
      items: parsed.items.filter(
        (i) => typeof i.slug === "string" && typeof i.quantity === "number" && i.quantity > 0
      ),
    };
  } catch {
    return { items: [] };
  }
}

export function writeCart(cart: CartState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

export function clearCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getCartCount(cart: CartState): number {
  return cart.items.reduce((sum, i) => sum + i.quantity, 0);
}
