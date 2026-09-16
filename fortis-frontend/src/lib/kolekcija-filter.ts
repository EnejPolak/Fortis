import { getKolekcijaBrandMeta } from "@/data/kolekcija-brands";
import { getParfumScentFamilies } from "@/data/parfum-families";
import { isScentFamilySlug, type ScentFamilySlug } from "@/data/scent-families";
import type { KolekcijaItem } from "@/data/parfumi";

export type KolekcijaFilterState = {
  brands: string[];
  families: ScentFamilySlug[];
};

export type BrandFilterOption = {
  /** Stable URL / filter slug */
  slug: string;
  /** Exact `KolekcijaItem.brand` value */
  brandKey: string;
  label: string;
};

export function brandToFilterSlug(brand: string): string {
  return brand
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function brandFilterLabel(brand: string): string {
  const display = getKolekcijaBrandMeta(brand).displayName;
  return display
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getBrandFilterOptions(items: KolekcijaItem[]): BrandFilterOption[] {
  const seen = new Set<string>();
  const options: BrandFilterOption[] = [];

  for (const item of items) {
    if (seen.has(item.brand)) continue;
    seen.add(item.brand);
    options.push({
      slug: brandToFilterSlug(item.brand),
      brandKey: item.brand,
      label: brandFilterLabel(item.brand),
    });
  }

  return options;
}

export function getItemScentFamilies(item: KolekcijaItem): ScentFamilySlug[] {
  return item.families?.length ? item.families : getParfumScentFamilies(item.slug);
}

export function filterKolekcijaItems(
  items: KolekcijaItem[],
  filters: KolekcijaFilterState
): KolekcijaItem[] {
  const { brands, families } = filters;

  return items.filter((item) => {
    const brandMatch =
      brands.length === 0 || brands.includes(brandToFilterSlug(item.brand));

    const itemFamilies = getItemScentFamilies(item);
    const familyMatch =
      families.length === 0 || families.some((f) => itemFamilies.includes(f));

    return brandMatch && familyMatch;
  });
}

export function countActiveFilters(filters: KolekcijaFilterState): number {
  return filters.brands.length + filters.families.length;
}

export function isFiltersEmpty(filters: KolekcijaFilterState): boolean {
  return filters.brands.length === 0 && filters.families.length === 0;
}

export function parseKolekcijaFiltersFromSearchParams(
  params: URLSearchParams
): KolekcijaFilterState {
  const brands = params
    .get("brand")
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

  const familiesRaw =
    params
      .get("family")
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const families = familiesRaw.filter(isScentFamilySlug);

  return { brands, families };
}

export function buildKolekcijaFilterSearchParams(filters: KolekcijaFilterState): string {
  const params = new URLSearchParams();

  if (filters.brands.length > 0) {
    params.set("brand", [...filters.brands].sort().join(","));
  }
  if (filters.families.length > 0) {
    params.set("family", [...filters.families].sort().join(","));
  }

  return params.toString();
}
