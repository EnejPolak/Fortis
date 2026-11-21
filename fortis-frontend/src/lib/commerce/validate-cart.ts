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
  quantity: number;
  unitCents: number;
  lineCents: number;
};

export type ValidateCartResult =
  | { ok: true; lines: ValidatedLine[]; subtotalCents: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

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
    merged.set(line.variantId, (merged.get(line.variantId) ?? 0) + qty);
  }

  const supabase = getServiceSupabase();
  const variantIds = [...merged.keys()];
  const stockMap = new Map<string, number>();

  if (supabase) {
    const { data } = await supabase
      .from("product_inventory")
      .select("variant_id, stock_quantity")
      .in("variant_id", variantIds);

    for (const row of data ?? []) {
      stockMap.set(row.variant_id, row.stock_quantity ?? 0);
    }
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

    let max = CART_MAX_LINE_QTY;
    if (stockMap.has(variantId)) {
      max = Math.min(CART_MAX_LINE_QTY, stockMap.get(variantId)!);
    }

    if (max <= 0) {
      fieldErrors[variantId] = `${product.name} ni na zalogi.`;
      continue;
    }

    if (quantity > max) {
      fieldErrors[variantId] = `Za ${product.name} je na zalogi največ ${max} kosov.`;
      continue;
    }

    lines.push({
      variantId,
      slug: variant.slug,
      productName: product.name,
      brand: product.brand,
      volumeLabel: variant.volumeLabel,
      imageSrc: product.imageSrc,
      quantity,
      unitCents: variant.unitCents,
      lineCents: variant.unitCents * quantity,
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
