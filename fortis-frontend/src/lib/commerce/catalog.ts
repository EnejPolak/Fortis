import { KOLEKCIJA_ITEMS, getParfumBySlug } from "@/data/parfumi";
import { getParfumPriceEur } from "@/lib/parfum-prices";
import { eurToCents } from "@/lib/commerce/money";

/**
 * One sellable variant per catalogue slug.
 * Volume comes from existing metaLine1 — no invented sizes.
 */
export type ProductVariant = {
  /** Stable id: `${slug}:${volumeKey}` */
  id: string;
  slug: string;
  volumeLabel: string;
  volumeKey: string;
  unitCents: number;
  currency: "eur";
};

export type SellableProduct = {
  slug: string;
  name: string;
  brand: string;
  imageSrc: string;
  concentration: string;
  variants: ProductVariant[];
  /** True when at least one priced variant exists. */
  isSellable: boolean;
};

function normalizeVolumeKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/,/g, ".");
}

export function getSellableProduct(slug: string): SellableProduct | null {
  const detail = getParfumBySlug(slug);
  const item = KOLEKCIJA_ITEMS.find((entry) => entry.slug === slug);
  if (!detail || !item) return null;

  const priceEur = getParfumPriceEur(slug);
  const volumeLabel = detail.metaLine1?.trim() || "—";
  const volumeKey = normalizeVolumeKey(volumeLabel);
  const variants: ProductVariant[] =
    priceEur != null
      ? [
          {
            id: `${slug}:${volumeKey}`,
            slug,
            volumeLabel,
            volumeKey,
            unitCents: eurToCents(priceEur),
            currency: "eur",
          },
        ]
      : [];

  return {
    slug,
    name: detail.name,
    brand: item.brand,
    imageSrc: detail.imageSrc,
    concentration: detail.metaLine2?.trim() || "",
    variants,
    isSellable: variants.length > 0,
  };
}

export function getVariantById(variantId: string): ProductVariant | null {
  const slug = variantId.split(":")[0];
  if (!slug) return null;
  const product = getSellableProduct(slug);
  return product?.variants.find((v) => v.id === variantId) ?? null;
}

export function listSellableProducts(): SellableProduct[] {
  return KOLEKCIJA_ITEMS.map((item) => getSellableProduct(item.slug)).filter(
    (p): p is SellableProduct => p != null && p.isSellable
  );
}

export function listVariantIds(): string[] {
  return listSellableProducts().flatMap((p) => p.variants.map((v) => v.id));
}
