"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addLine,
  cartItemCount,
  cartSubtotalCents,
  emptyCart,
  hydrateCartLines,
  mergeCartLines,
  parseStoredCart,
  removeLine,
  setLineQuantity,
} from "@/lib/cart/cart-logic";
import { CART_STORAGE_KEY, type CartState, type HydratedCartLine } from "@/lib/cart/types";

type CartContextValue = {
  ready: boolean;
  lines: HydratedCartLine[];
  itemCount: number;
  subtotalCents: number;
  isOpen: boolean;
  stockByVariant: Record<string, number | null>;
  /** Increments only after a successful addItem — for bag wobble, not hydration. */
  addSuccessVersion: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity?: number) => { error?: string };
  updateQuantity: (variantId: string, quantity: number) => { error?: string };
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  getLineQuantity: (variantId: string) => number;
  mergeGuestCart: (guest: CartState) => void;
  announce: string;
};

const CartContext = createContext<CartContextValue | null>(null);

function readLocalCart(): CartState {
  if (typeof window === "undefined") return emptyCart();
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return emptyCart();
    return parseStoredCart(JSON.parse(raw)) ?? emptyCart();
  } catch {
    return emptyCart();
  }
}

function writeLocalCart(state: CartState) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(emptyCart);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [addSuccessVersion, setAddSuccessVersion] = useState(0);
  const [stockByVariant, setStockByVariant] = useState<Record<string, number | null>>(
    {}
  );
  const closeTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setState(readLocalCart());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeLocalCart(state);
  }, [state, ready]);

  useEffect(() => {
    if (!ready || state.lines.length === 0) return;
    let cancelled = false;
    const ids = state.lines.map((l) => l.variantId).join(",");
    fetch(`/api/commerce/stock?ids=${encodeURIComponent(ids)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.stock) return;
        setStockByVariant((prev) => ({ ...prev, ...data.stock }));
      })
      .catch(() => {
        /* stock API optional until configured */
      });
    return () => {
      cancelled = true;
    };
  }, [ready, state.lines]);

  const lines = useMemo(
    () => hydrateCartLines(state, stockByVariant),
    [state, stockByVariant]
  );
  const itemCount = useMemo(() => cartItemCount(state), [state]);
  const subtotalCents = useMemo(() => cartSubtotalCents(lines), [lines]);

  const openCart = useCallback(() => {
    closeTriggerRef.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsOpen(false);
    queueMicrotask(() => closeTriggerRef.current?.focus?.());
  }, []);

  const addItem = useCallback(
    (variantId: string, quantity = 1) => {
      let error: string | undefined;
      setState((prev) => {
        const result = addLine(prev, variantId, quantity, stockByVariant[variantId]);
        error = result.error;
        if (!error) {
          setAnnounce("Izdelek dodan v košarico.");
        }
        return result.state;
      });
      if (!error) {
        setAddSuccessVersion((version) => version + 1);
      }
      return { error };
    },
    [stockByVariant]
  );

  const updateQuantity = useCallback(
    (variantId: string, quantity: number) => {
      let error: string | undefined;
      setState((prev) => {
        const result = setLineQuantity(
          prev,
          variantId,
          quantity,
          stockByVariant[variantId]
        );
        error = result.error;
        return result.state;
      });
      return { error };
    },
    [stockByVariant]
  );

  const removeItem = useCallback((variantId: string) => {
    setState((prev) => removeLine(prev, variantId));
    setAnnounce("Izdelek odstranjen iz košarice.");
  }, []);

  const clearCart = useCallback(() => {
    setState(emptyCart());
  }, []);

  const getLineQuantity = useCallback(
    (variantId: string) =>
      state.lines.find((l) => l.variantId === variantId)?.quantity ?? 0,
    [state.lines]
  );

  const mergeGuestCart = useCallback((guest: CartState) => {
    setState((prev) => ({
      lines: mergeCartLines(prev.lines, guest.lines),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const value: CartContextValue = {
    ready,
    lines,
    itemCount,
    subtotalCents,
    isOpen,
    stockByVariant,
    addSuccessVersion,
    openCart,
    closeCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getLineQuantity,
    mergeGuestCart,
    announce,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
