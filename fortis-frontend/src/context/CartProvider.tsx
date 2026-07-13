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
import { getWineBySlug } from "@/data/wine";
import { fetchInventory } from "@/lib/inventory-client";
import {
  clearCart as clearStoredCart,
  getCartCount,
  readCart,
  writeCart,
  type CartLine,
} from "@/lib/cart-storage";

type CartContextValue = {
  items: CartLine[];
  count: number;
  stockBySlug: Record<string, number>;
  maxQuantityFor: (slug: string) => number;
  addItem: (slug: string, quantity: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalizeItem(
  slug: string,
  quantity: number,
  maxPerLine: number
): CartLine | null {
  if (maxPerLine < 1) return null;
  const q = Math.max(1, Math.min(maxPerLine, Math.floor(quantity)));
  return { slug, quantity: q };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [stockBySlug, setStockBySlug] = useState<Record<string, number>>({});
  const [availableBySlug, setAvailableBySlug] = useState<Record<string, number>>({});

  useEffect(() => {
    setItems(readCart().items);
    setHydrated(true);
  }, []);

  const maxQuantityFor = useCallback(
    (slug: string) => {
      const wine = getWineBySlug(slug);
      const available = availableBySlug[slug];
      if (available !== undefined) return available;
      return wine?.maxQuantity ?? 12;
    },
    [availableBySlug]
  );

  const persist = useCallback((next: CartLine[]) => {
    setItems(next);
    writeCart({ items: next });
  }, []);

  useEffect(() => {
    if (!hydrated || items.length === 0) {
      setStockBySlug({});
      setAvailableBySlug({});
      return;
    }

    const slugs = [...new Set(items.map((item) => item.slug))];

    Promise.all(
      slugs.map(async (slug) => {
        try {
          const data = await fetchInventory(slug);
          return { slug, stock: data.stock, available: data.available };
        } catch {
          const wine = getWineBySlug(slug);
          const fallback = wine?.maxQuantity ?? 12;
          return { slug, stock: fallback, available: fallback };
        }
      })
    ).then((rows) => {
      setStockBySlug(Object.fromEntries(rows.map((row) => [row.slug, row.stock])));
      setAvailableBySlug(
        Object.fromEntries(rows.map((row) => [row.slug, row.available]))
      );
    });
  }, [hydrated, items]);

  useEffect(() => {
    if (!hydrated || items.length === 0) return;

    let changed = false;
    const next = items.flatMap((item) => {
      const max = maxQuantityFor(item.slug);
      if (max < 1) {
        changed = true;
        return [];
      }
      if (item.quantity > max) {
        changed = true;
        const normalized = normalizeItem(item.slug, max, max);
        return normalized ? [normalized] : [];
      }
      return [item];
    });

    if (changed) {
      persist(next);
    }
  }, [availableBySlug, hydrated, items, maxQuantityFor, persist]);

  const addItem = useCallback(
    (slug: string, quantity: number) => {
      const max = maxQuantityFor(slug);
      if (max < 1) return;

      const normalized = normalizeItem(slug, quantity, max);
      if (!normalized) return;

      const q = normalized.quantity;
      setItems((prev) => {
        const existing = prev.find((i) => i.slug === slug);
        const merged = existing
          ? prev.flatMap((i) => {
              if (i.slug !== slug) return [i];
              const updated = normalizeItem(slug, i.quantity + q, max);
              return updated ? [updated] : [];
            })
          : [...prev, { slug, quantity: q }];
        writeCart({ items: merged });
        return merged;
      });
    },
    [maxQuantityFor]
  );

  const setQuantity = useCallback(
    (slug: string, quantity: number) => {
      const max = maxQuantityFor(slug);
      if (quantity < 1) {
        persist(items.filter((i) => i.slug !== slug));
        return;
      }
      const normalized = normalizeItem(slug, quantity, max);
      if (!normalized) {
        persist(items.filter((i) => i.slug !== slug));
        return;
      }
      const next = items.map((i) =>
        i.slug === slug ? normalized : i
      );
      persist(next);
    },
    [items, maxQuantityFor, persist]
  );

  const removeItem = useCallback(
    (slug: string) => {
      persist(items.filter((i) => i.slug !== slug));
    },
    [items, persist]
  );

  const clear = useCallback(() => {
    clearStoredCart();
    setItems([]);
    setStockBySlug({});
    setAvailableBySlug({});
  }, []);

  const count = useMemo(() => (hydrated ? getCartCount({ items }) : 0), [hydrated, items]);

  const value = useMemo(
    () => ({
      items: hydrated ? items : [],
      count,
      stockBySlug,
      maxQuantityFor,
      addItem,
      setQuantity,
      removeItem,
      clearCart: clear,
    }),
    [
      hydrated,
      items,
      count,
      stockBySlug,
      maxQuantityFor,
      addItem,
      setQuantity,
      removeItem,
      clear,
    ]
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
