"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearCart as clearStoredCart,
  getCartCount,
  readCart,
  writeCart,
  type CartLine,
  type CartState,
} from "@/lib/cart-storage";

type CartContextValue = {
  items: CartLine[];
  count: number;
  addItem: (slug: string, quantity: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalizeItem(slug: string, quantity: number, maxPerLine: number): CartLine {
  const q = Math.max(1, Math.min(maxPerLine, Math.floor(quantity)));
  return { slug, quantity: q };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCart().items);
    setHydrated(true);
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setItems(next);
    writeCart({ items: next });
  }, []);

  const addItem = useCallback(
    (slug: string, quantity: number) => {
      const max = 12;
      const q = normalizeItem(slug, quantity, max).quantity;
      setItems((prev) => {
        const existing = prev.find((i) => i.slug === slug);
        const merged = existing
          ? prev.map((i) =>
              i.slug === slug
                ? normalizeItem(slug, i.quantity + q, max)
                : i
            )
          : [...prev, { slug, quantity: q }];
        writeCart({ items: merged });
        return merged;
      });
    },
    []
  );

  const setQuantity = useCallback((slug: string, quantity: number) => {
    const max = 12;
    if (quantity < 1) {
      persist(items.filter((i) => i.slug !== slug));
      return;
    }
    const next = items.map((i) =>
      i.slug === slug ? normalizeItem(slug, quantity, max) : i
    );
    persist(next);
  }, [items, persist]);

  const removeItem = useCallback(
    (slug: string) => {
      persist(items.filter((i) => i.slug !== slug));
    },
    [items, persist]
  );

  const clear = useCallback(() => {
    clearStoredCart();
    setItems([]);
  }, []);

  const count = useMemo(() => (hydrated ? getCartCount({ items }) : 0), [hydrated, items]);

  const value = useMemo(
    () => ({
      items: hydrated ? items : [],
      count,
      addItem,
      setQuantity,
      removeItem,
      clearCart: clear,
    }),
    [hydrated, items, count, addItem, setQuantity, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
