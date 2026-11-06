import { KOLEKCIJA_ITEMS, getParfumBySlug } from "@/data/parfumi";

/** Cene po posameznem parfumu (kjer se razlikujejo od znamke). */
const SLUG_PRICE_EUR: Record<string, number> = {
  "meo-nota-di-viaggio-1": 180,
  "kinetic-insomnia": 255,
  "kinetic-aura": 181,
  "kinetic-kayu": 181,
  "kinetic-verdigris": 181,
  "kinetic-neo-sillage": 205,
  "kinetic-mosaic": 205,
  "kinetic-sillage": 195,
  "spiritica-jeffrey": 265,
  "spiritica-yuzu-yakuza": 225,
  "spiritica-mango-macumba": 200,
  "spiritica-leonarda": 220,
  "spiritica-lynch": 315,
  "spiritica-weona": 340,
};

/** Enaka cena za celotno znamko. */
const BRAND_PRICE_EUR: Record<string, number> = {
  Headspace: 105,
  Gravel: 160,
  Baruti: 135,
  "Almost Human": 165,
  Floramara: 145,
  "French Cowboy": 115,
  Zoologist: 250,
  "Art Brüt": 120,
  "Nuit Vagabonde": 195,
};

const MEO_FUSCIUNI_DEFAULT_EUR = 220;
const HEDONIK_30ML_EUR = 120;
const HEDONIK_50ML_EUR = 175;

export function getParfumPriceEur(slug: string): number | null {
  if (slug in SLUG_PRICE_EUR) {
    return SLUG_PRICE_EUR[slug];
  }

  const item = KOLEKCIJA_ITEMS.find((entry) => entry.slug === slug);
  if (!item) {
    return null;
  }

  if (item.brand === "Meo Fusciuni") {
    return MEO_FUSCIUNI_DEFAULT_EUR;
  }

  if (item.brand === "Hedonik") {
    const metaLine1 = getParfumBySlug(slug)?.metaLine1 ?? "";
    if (metaLine1.includes("50")) {
      return HEDONIK_50ML_EUR;
    }
    return HEDONIK_30ML_EUR;
  }

  if (item.brand === "Kinetic Parfums Barcelona") {
    return null;
  }

  return BRAND_PRICE_EUR[item.brand] ?? null;
}

export function formatParfumPrice(eur: number): string {
  return `${eur} €`;
}
