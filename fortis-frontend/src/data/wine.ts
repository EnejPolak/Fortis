export type WineProduct = {
  slug: string;
  name: string;
  vintage: string;
  producer: string;
  tagline: string;
  description: string;
  heroImageSrc: string;
  imageSrc: string;
  /** Cena brez DDV na kos (centi). */
  priceNetCents: number;
  /** DDV na kos (centi). */
  vatCents: number;
  /** Cena z DDV na kos (centi) — znesek za plačilo. */
  priceCents: number;
  currency: "eur";
  maxQuantity: number;
};

export const PRIMO_WINE: WineProduct = {
  slug: "primo",
  name: "PRIMO",
  vintage: "2023",
  producer: "Klet — podrobnosti kmalu",
  tagline: "Vino, ki pripoveduje zgodbo sonca, morja in briških gričev.",
  description:
    "Redka izbira Fortis Niche Atelier. Ne za množico, temveč za trenutek, ko želite, da večer diši po poletju in morju.",
  heroImageSrc: "/wine/primo-hero.webp",
  imageSrc: "/wine/primo-bottle.png",
  priceNetCents: 1500,
  vatCents: 300,
  priceCents: 1800,
  currency: "eur",
  maxQuantity: 12,
};

const WINES_BY_SLUG: Record<string, WineProduct> = {
  [PRIMO_WINE.slug]: PRIMO_WINE,
};

export function getWineBySlug(slug: string): WineProduct | null {
  return WINES_BY_SLUG[slug] ?? null;
}

export function getAllWineSlugs(): string[] {
  return Object.keys(WINES_BY_SLUG);
}

export function formatMoneyCents(
  cents: number,
  currency: string = "EUR"
): string {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function formatWinePrice(wine: WineProduct): string {
  return formatMoneyCents(wine.priceCents, wine.currency);
}
