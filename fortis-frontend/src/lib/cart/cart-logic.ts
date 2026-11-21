import { getSellableProduct, getVariantById } from "@/lib/commerce/catalog";
import {
  CART_MAX_LINE_QTY,
  type CartLine,
  type CartState,
  type HydratedCartLine,
} from "@/lib/cart/types";

export function emptyCart(): CartState {
  return { lines: [], updatedAt: new Date().toISOString() };
}

export function clampQuantity(qty: number, max: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.max(1, Math.min(Math.floor(qty), Math.max(1, max)));
}

export function getMaxQuantityForVariant(_variantId: string, stock?: number | null): number {
  if (stock == null) return CART_MAX_LINE_QTY;
  return Math.max(0, Math.min(CART_MAX_LINE_QTY, stock));
}

export function mergeCartLines(a: CartLine[], b: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const line of [...a, ...b]) {
    const existing = map.get(line.variantId);
    if (existing) {
      map.set(line.variantId, {
        ...existing,
        quantity: existing.quantity + line.quantity,
      });
    } else {
      map.set(line.variantId, { ...line });
    }
  }
  return Array.from(map.values());
}

export function addLine(
  state: CartState,
  variantId: string,
  quantity: number,
  stock?: number | null
): { state: CartState; error?: string } {
  const variant = getVariantById(variantId);
  if (!variant) {
    return { state, error: "Izdelek ni na voljo." };
  }

  const max = getMaxQuantityForVariant(variantId, stock);
  if (max <= 0) {
    return { state, error: "Izdelek trenutno ni na zalogi." };
  }

  const existing = state.lines.find((l) => l.variantId === variantId);
  const nextQty = clampQuantity((existing?.quantity ?? 0) + quantity, max);

  if (existing && nextQty === existing.quantity && quantity > 0) {
    return {
      state,
      error: `Na zalogi je največ ${max} kosov.`,
    };
  }

  const lines = existing
    ? state.lines.map((l) =>
        l.variantId === variantId ? { ...l, quantity: nextQty } : l
      )
    : [
        ...state.lines,
        { variantId, slug: variant.slug, quantity: clampQuantity(quantity, max) },
      ];

  return {
    state: { lines, updatedAt: new Date().toISOString() },
  };
}

export function setLineQuantity(
  state: CartState,
  variantId: string,
  quantity: number,
  stock?: number | null
): { state: CartState; error?: string } {
  if (quantity <= 0) {
    return {
      state: {
        lines: state.lines.filter((l) => l.variantId !== variantId),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  const max = getMaxQuantityForVariant(variantId, stock);
  if (max <= 0) {
    return {
      state: {
        lines: state.lines.filter((l) => l.variantId !== variantId),
        updatedAt: new Date().toISOString(),
      },
      error: "Izdelek ni več na zalogi.",
    };
  }

  const qty = clampQuantity(quantity, max);
  const lines = state.lines.map((l) =>
    l.variantId === variantId ? { ...l, quantity: qty } : l
  );

  return {
    state: { lines, updatedAt: new Date().toISOString() },
    error: qty < quantity ? `Na zalogi je največ ${max} kosov.` : undefined,
  };
}

export function removeLine(state: CartState, variantId: string): CartState {
  return {
    lines: state.lines.filter((l) => l.variantId !== variantId),
    updatedAt: new Date().toISOString(),
  };
}

export function cartItemCount(state: CartState): number {
  return state.lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function hydrateCartLines(
  state: CartState,
  stockByVariant?: Record<string, number | null>
): HydratedCartLine[] {
  return state.lines
    .map((line) => {
      const variant = getVariantById(line.variantId);
      const product = variant ? getSellableProduct(variant.slug) : null;
      if (!variant || !product) return null;

      const stock = stockByVariant?.[line.variantId];
      const max = getMaxQuantityForVariant(line.variantId, stock);
      const available = max > 0;
      const quantity = available ? clampQuantity(line.quantity, max) : line.quantity;

      return {
        ...line,
        quantity,
        name: product.name,
        brand: product.brand,
        imageSrc: product.imageSrc,
        volumeLabel: variant.volumeLabel,
        unitCents: variant.unitCents,
        lineCents: variant.unitCents * quantity,
        maxQuantity: max,
        available,
      } satisfies HydratedCartLine;
    })
    .filter((l): l is HydratedCartLine => l != null);
}

export function cartSubtotalCents(lines: HydratedCartLine[]): number {
  return lines.reduce((sum, l) => sum + l.lineCents, 0);
}

export function parseStoredCart(raw: unknown): CartState | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as { lines?: unknown; updatedAt?: unknown };
  if (!Array.isArray(obj.lines)) return null;

  const lines: CartLine[] = [];
  for (const entry of obj.lines) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.variantId !== "string" || typeof e.slug !== "string") continue;
    const quantity = Number(e.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) continue;
    if (!getVariantById(e.variantId)) continue;
    lines.push({
      variantId: e.variantId,
      slug: e.slug,
      quantity: Math.floor(quantity),
    });
  }

  return {
    lines,
    updatedAt:
      typeof obj.updatedAt === "string" ? obj.updatedAt : new Date().toISOString(),
  };
}
