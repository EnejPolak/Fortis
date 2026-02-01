export type ParfumDetailData = {
  imageSrc: string;
  name: string;
  metaLine1: string;
  metaLine2: string;
  description: string;
  notes?: string;
  ingredients?: string;
};

export type KolekcijaItem = {
  slug: string;
  imageSrc: string;
  alt: string;
  brand: string;
  name: string;
  imageClassName?: string;
};

const META_PLACEHOLDER = "100 ml";
const META_PLACEHOLDER_2 = "Eau de Parfum";

/** Polni podatki za posamezne parfume (opis, notes, ingredients). Če slug ni v seznamu, se uporabijo privzeti meta. */
const PARFUM_DETAIL_OVERRIDES: Partial<Record<string, Pick<ParfumDetailData, "metaLine1" | "metaLine2" | "description" | "notes" | "ingredients">>> = {
  "kinetic-aura": {
    metaLine1: "100 ml",
    metaLine2: "Eau de Parfum",
    description:
      "AURA je navdihnjena z idejo nevidnega, nematerialnega prostora, ki obdaja ljudi, živali in predmete. Plasti dišave se ovijejo okoli osebe kot mreža vibracij. Prepoznavna barva AURE simbolizira toplino in čutnost ter odraža barvo njenega ključnega akorda: maline.\nParfumer: Chris Maurice (Christian Carbonnel)",
    notes:
      "TOP NOTES:\nCalabrian bergamot, Brazilian orange, grapefruit, pineapple\n\nMIDDLE NOTES:\nraspberry, passion fruit from Perú, plum, lily of the valley, Indian jasmine sambac, vanilla\n\nBASE NOTES:\nwoody notes, caramel, oakmoss, amber, musk",
    ingredients:
      "ALCOHOL DENAT, PARFUM, AQUA, ALPHA-ISOMETHYL IONONE, BENZYL ALCOHOL, BENZYL SALICYLATE, CITRAL, COUMARIN, FARNESOL, GERANIOL, HYDROXYCITRONELLAL, LIMONENE, LINALOOL.",
  },
};

export const KOLEKCIJA_ITEMS: KolekcijaItem[] = [
  { slug: "kinetic-aura", imageSrc: "/Kinetic/Aura.png", alt: "Aura", brand: "Kinetic Parfums Barcelona", name: "Aura" },
  { slug: "kinetic-insomnia", imageSrc: "/Kinetic/Insomnia.png", alt: "Insomnia", brand: "Kinetic Parfums Barcelona", name: "Insomnia" },
  { slug: "kinetic-kayu", imageSrc: "/Kinetic/Kayu.png", alt: "Kayu", brand: "Kinetic Parfums Barcelona", name: "Kayu" },
  { slug: "kinetic-mosaic", imageSrc: "/Kinetic/Mosaic.png", alt: "Mosaic", brand: "Kinetic Parfums Barcelona", name: "Mosaic" },
  { slug: "kinetic-sillage", imageSrc: "/Kinetic/Sillage.png", alt: "Sillage", brand: "Kinetic Parfums Barcelona", name: "Sillage" },
  { slug: "kinetic-verdigris", imageSrc: "/Kinetic/Verdigris.png", alt: "Verdigris", brand: "Kinetic Parfums Barcelona", name: "Verdigris" },
  { slug: "hedonik-divine-perversion", imageSrc: "/Hedonik/DivinePerversion.webp", alt: "Divine Perversion", brand: "Hedonik", name: "Divine Perversion" },
  { slug: "hedonik-exquisite-affair", imageSrc: "/Hedonik/ExquisiteAffair.png", alt: "Exquisite Affair", brand: "Hedonik", name: "Exquisite Affair" },
  { slug: "hedonik-obsessive-devotion", imageSrc: "/Hedonik/ObsessiveDevotion.webp", alt: "Obsessive Devotion", brand: "Hedonik", name: "Obsessive Devotion" },
  { slug: "meo-nota-di-viaggio-1", imageSrc: "/Meo/1%23NotaDiViaggio.png", alt: "Nota Di Viaggio 1", brand: "Meo Fusciuni", name: "Nota Di Viaggio 1" },
  { slug: "meo-sogni", imageSrc: "/Meo/Sogni.png", alt: "Sogni", brand: "Meo Fusciuni", name: "Sogni" },
  { slug: "meo-narcotico", imageSrc: "/Meo/Narcotico.png", alt: "Narcotico", brand: "Meo Fusciuni", name: "Narcotico", imageClassName: "kolekcija-image kolekcija-image-narcotico" },
  { slug: "meo-notturno", imageSrc: "/Meo/Notturno.png", alt: "Notturno", brand: "Meo Fusciuni", name: "Notturno" },
  { slug: "meo-varanasi", imageSrc: "/Meo/Varanasi.png", alt: "Varanasi", brand: "Meo Fusciuni", name: "Varanasi" },
  { slug: "meo-littlesong", imageSrc: "/Meo/LittleSong.png", alt: "LittleSong", brand: "Meo Fusciuni", name: "LittleSong" },
  { slug: "meo-nota-di-viaggio-2", imageSrc: "/Meo/2%23NotaDiViaggio.png", alt: "Nota Di Viaggio 2", brand: "Meo Fusciuni", name: "Nota Di Viaggio 2" },
  { slug: "meo-odor93", imageSrc: "/Meo/Odor93.png", alt: "Odor93", brand: "Meo Fusciuni", name: "Odor93" },
  { slug: "headspace-absinth", imageSrc: "/Headspace/absinth.webp", alt: "Absinth", brand: "Headspace", name: "Absinth" },
  { slug: "headspace-genviere", imageSrc: "/Headspace/Genviere.png", alt: "Genviere", brand: "Headspace", name: "Genviere" },
  { slug: "headspace-kirsch", imageSrc: "/Headspace/kirsch.webp", alt: "Kirsch", brand: "Headspace", name: "Kirsch" },
  { slug: "headspace-myrrhe", imageSrc: "/Headspace/Myrrhe.png", alt: "Myrrhe", brand: "Headspace", name: "Myrrhe" },
  { slug: "headspace-santal", imageSrc: "/Headspace/santal.webp", alt: "Santal", brand: "Headspace", name: "Santal" },
  { slug: "headspace-sauge", imageSrc: "/Headspace/Sauge.png", alt: "Sauge", brand: "Headspace", name: "Sauge" },
  { slug: "headspace-syrax", imageSrc: "/Headspace/Syrax.png", alt: "Syrax", brand: "Headspace", name: "Syrax" },
  { slug: "headspace-tubereuse", imageSrc: "/Headspace/tubereuse.png", alt: "Tubereuse", brand: "Headspace", name: "Tubereuse" },
  { slug: "barutti-berlin-in-winter", imageSrc: "/Barutti/BerlininWinter.png", alt: "Berlin in Winter", brand: "Barutti", name: "Berlin in Winter" },
  { slug: "barutti-chai", imageSrc: "/Barutti/Chai.png", alt: "Chai", brand: "Barutti", name: "Chai" },
  { slug: "barutti-dama-koupa", imageSrc: "/Barutti/Dama%20Koupa.png", alt: "Dama Koupa", brand: "Barutti", name: "Dama Koupa" },
  { slug: "barutti-nooud", imageSrc: "/Barutti/Nooud.png", alt: "Nooud", brand: "Barutti", name: "Nooud" },
  { slug: "barutti-oh-my-deer", imageSrc: "/Barutti/OhMyDeer.png", alt: "Oh My Deer", brand: "Barutti", name: "Oh My Deer" },
  { slug: "barutti-preverso", imageSrc: "/Barutti/Preverso.png", alt: "Preverso", brand: "Barutti", name: "Preverso" },
  { slug: "bepolar", imageSrc: "/Bepolar/Bepolar.png", alt: "Bepolar", brand: "Bepolar", name: "Bepolar" },
];

const PARFUM_BY_SLUG: Record<string, ParfumDetailData> = {};
KOLEKCIJA_ITEMS.forEach((item) => {
  const overrides = PARFUM_DETAIL_OVERRIDES[item.slug];
  PARFUM_BY_SLUG[item.slug] = {
    imageSrc: item.imageSrc,
    name: item.name,
    metaLine1: overrides?.metaLine1 ?? META_PLACEHOLDER,
    metaLine2: overrides?.metaLine2 ?? META_PLACEHOLDER_2,
    description: overrides?.description ?? "",
    notes: overrides?.notes ?? "",
    ingredients: overrides?.ingredients ?? "",
  };
});

export function getParfumBySlug(slug: string): ParfumDetailData | null {
  return PARFUM_BY_SLUG[slug] ?? null;
}
