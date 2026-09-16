import type { KolekcijaItem } from "./parfumi";

export type KolekcijaBrandMeta = {
  displayName: string;
  logo?: string;
  tagline?: string;
};

/** Keys must match `KolekcijaItem.brand` exactly. */
export const KOLEKCIJA_BRAND_META: Record<string, KolekcijaBrandMeta> = {
  "Kinetic Parfums Barcelona": {
    displayName: "KINETIC",
    logo: "/Trail/Kinetic.png",
    tagline: "MODERN PERFUMERY IN MOTION",
  },
  Hedonik: {
    displayName: "HEDONIK",
    logo: "/Trail/Hedonik.png",
  },
  "Meo Fusciuni": {
    displayName: "MEO FUSCIUNI",
    logo: "/Trail/Meo.png",
  },
  Headspace: {
    displayName: "HEADSPACE",
    logo: "/Trail/Headspace.png",
  },
  Baruti: {
    displayName: "BARUTI",
    logo: "/Trail/Baruti.png",
  },
  Bepolar: {
    displayName: "BEPOLAR",
    logo: "/Trail/Bepolar.png",
  },
  "Almost Human": {
    displayName: "ALMOST HUMAN",
    logo: "/Trail/Almosthuman.png",
  },
  Floramara: {
    displayName: "FLORAMARA",
    logo: "/Trail/FLORAMARA-LOGO.jpg",
  },
  "French Cowboy": {
    displayName: "FRENCH COWBOY",
    logo: "/Trail/FrenchCowboy.png",
  },
  Zoologist: {
    displayName: "ZOOLOGIST",
    logo: "/Trail/zoologist.png",
  },
  "Art Brüt": {
    displayName: "ART BRÜT",
    logo: "/Trail/Art%20Brut.png",
  },
  Spiritica: {
    displayName: "SPIRITICA",
    logo: "/Trail/Spiritica.png",
  },
};

export function getKolekcijaBrandMeta(brand: string): KolekcijaBrandMeta {
  return (
    KOLEKCIJA_BRAND_META[brand] ?? {
      displayName: brand.toUpperCase(),
    }
  );
}

export type KolekcijaBrandGroup = {
  brand: string;
  meta: KolekcijaBrandMeta;
  items: KolekcijaItem[];
};

export function groupKolekcijaItemsByBrand(items: KolekcijaItem[]): KolekcijaBrandGroup[] {
  const groups: KolekcijaBrandGroup[] = [];

  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.brand === item.brand) {
      last.items.push(item);
    } else {
      groups.push({
        brand: item.brand,
        meta: getKolekcijaBrandMeta(item.brand),
        items: [item],
      });
    }
  }

  return groups;
}
