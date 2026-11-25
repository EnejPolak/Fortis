import { getSellableProduct, getVariantById } from "@/lib/commerce/catalog";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { CART_MAX_LINE_QTY } from "@/lib/cart/types";

export type CartInputLine = {
  variantId: string;
  quantity: number;
};

export type ValidatedLine = {
  variantId: string;
  slug: string;
  productName: string;
  brand: string;
  volumeLabel: string;
  imageSrc: string;
  sku: string | null;
  quantity: number;
  unitCents: number;
  lineCents: number;
};

export type ValidateCartResult =
  | { ok: true; lines: ValidatedLine[]; subtotalCents: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

type InventoryRow = {
  variant_id: string;
  stock_quantity: number;
  unit_cents: number | null;
  is_active: boolean;
  sku: string | null;
};

/**
 * Server-side cart validation for checkout.
 * Requires an active product_inventory row — missing stock never becomes unlimited.
 * Unit price: inventory.unit_cents if set, otherwise catalogue file price.
 */
export async function validateCartLines(
  input: CartInputLine[]
): Promise<ValidateCartResult> {
  if (!Array.isArray(input) || input.length === 0) {
    return { ok: false, error: "Košarica je prazna." };
  }

  const merged = new Map<string, number>();
  for (const line of input) {
    if (!line?.variantId || typeof line.variantId !== "string") {
      return { ok: false, error: "Neveljavna vrstica v košarici." };
    }
    const qty = Number(line.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return { ok: false, error: "Neveljavna količina." };
    }
    if (qty > CART_MAX_LINE_QTY) {
      return { ok: false, error: `Največja količina je ${CART_MAX_LINE_QTY}.` };
    }
    merged.set(line.variantId, (merged.get(line.variantId) ?? 0) + qty);
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return {
      ok: false,
      error: "Blagajna še ni konfigurirana (Supabase).",
    };
  }

  const variantIds = [...merged.keys()];
  const { data: invRows, error: invError } = await supabase
    .from("product_inventory")
    .select("variant_id, stock_quantity, unit_cents, is_active, sku")
    .in("variant_id", variantIds);

  if (invError) {
    console.error("inventory load", invError.message);
    return { ok: false, error: "Zaloge trenutno ni mogoče preveriti." };
  }

  const stockMap = new Map<string, InventoryRow>();
  for (const row of (invRows ?? []) as InventoryRow[]) {
    stockMap.set(row.variant_id, row);
  }

  const lines: ValidatedLine[] = [];
  const fieldErrors: Record<string, string> = {};

  for (const [variantId, quantity] of merged) {
    const variant = getVariantById(variantId);
    const product = variant ? getSellableProduct(variant.slug) : null;
    if (!variant || !product) {
      fieldErrors[variantId] = "Izdelek ni več na voljo.";
      continue;
    }

    const inv = stockMap.get(variantId);
    if (!inv || !inv.is_active) {
      fieldErrors[variantId] =
        `${product.name} ni na voljo za nakup (zaloga ni vpisana ali je neaktiven).`;
      continue;
    }

    const max = Math.min(CART_MAX_LINE_QTY, Math.max(0, inv.stock_quantity ?? 0));
    if (max <= 0) {
      fieldErrors[variantId] = `${product.name} ni na zalogi.`;
      continue;
    }

    if (quantity > max) {
      fieldErrors[variantId] = `Za ${product.name} je na zalogi največ ${max} kosov.`;
      continue;
    }

    const unitCents =
      inv.unit_cents != null && inv.unit_cents >= 0
        ? inv.unit_cents
        : variant.unitCents;

    if (!Number.isInteger(unitCents) || unitCents <= 0) {
      fieldErrors[variantId] = `${product.name} nima veljavne cene.`;
      continue;
    }

    lines.push({
      variantId,
      slug: variant.slug,
      productName: product.name,
      brand: product.brand,
      volumeLabel: variant.volumeLabel,
      imageSrc: product.imageSrc,
      sku: inv.sku,
      quantity,
      unitCents,
      lineCents: unitCents * quantity,
    });
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: "Nekateri izdelki niso na voljo v želeni količini.",
      fieldErrors,
    };
  }

  const subtotalCents = lines.reduce((sum, l) => sum + l.lineCents, 0);
  return { ok: true, lines, subtotalCents };
}
