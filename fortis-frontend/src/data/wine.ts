export type WineProduct = {
  slug: string;
  name: string;
  vintage: string;
  producer: string;
  tagline: string;
  description: string;
  heroImageSrc: string;
  imageSrc: string;
  priceCents: number;
  currency: "eur";
  maxQuantity: number;
};

export const PRIMO_WINE: WineProduct = {
  slug: "primo",
  name: "PRIMO",
  vintage: "2023",
  producer: "Klet — podrobnosti kmalu",
  tagline: "Bela, ki diši po morju in soncu.",
  description:
    "PRIMO je belo vino, rojeno tam, kjer se morje sreča s soncem in kamnom. V kozarcu je svetloba jutra nad obalo — čista, topla, nežno slana.\n\nRedka izbira Fortis Niche Atelier. Ne za množico, temveč za trenutek, ko želite, da večer diši po pomladi in morju.",
  heroImageSrc: "/wine/primo-hero.webp",
  imageSrc: "/wine/primo-bottle.png",
  priceCents: 2800,
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

export function formatWinePrice(wine: WineProduct): string {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: wine.currency.toUpperCase(),
  }).format(wine.priceCents / 100);
}
