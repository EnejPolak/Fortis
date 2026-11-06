import type { ScentFamilySlug } from "./scent-families";

/**
 * Ena glavna vonjna kategorija na parfum (za filtre v kolekciji).
 * Keys = KOLEKCIJA_ITEMS.slug
 */
export const PARFUM_SCENT_FAMILIES: Partial<Record<string, ScentFamilySlug[]>> = {
  // Kinetic Parfums Barcelona
  "kinetic-neo-sillage": ["amber"],
  "kinetic-aura": ["amber"],
  "kinetic-insomnia": ["woody"],
  "kinetic-kayu": ["woody"],
  "kinetic-mosaic": ["amber"],
  "kinetic-sillage": ["amber"],
  "kinetic-verdigris": ["aquatic"],

  // Hedonik
  "hedonik-divine-perversion": ["amber"],
  "hedonik-exquisite-affair": ["amber"],
  "hedonik-obsessive-devotion": ["chypre"],

  // Meo Fusciuni
  "meo-nota-di-viaggio-1": ["woody"],
  "meo-sogni": ["woody"],
  "meo-narcotico": ["amber"],
  "meo-notturno": ["woody"],
  "meo-varanasi": ["weird"],
  "meo-littlesong": ["woody"],
  "meo-nota-di-viaggio-2": ["fougere"],
  "meo-odor93": ["floral"],

  // Headspace
  "headspace-absinth": ["woody"],
  "headspace-genviere": ["fougere"],
  "headspace-kirsch": ["amber"],
  "headspace-myrrhe": ["woody"],
  "headspace-santal": ["woody"],
  "headspace-sauge": ["fougere"],
  "headspace-syrax": ["woody"],
  "headspace-tubereuse": ["floral"],

  // Baruti
  "barutti-berlin-in-winter": ["amber"],
  "barutti-chai": ["amber"],
  "barutti-dama-koupa": ["floral"],
  "barutti-nooud": ["woody"],
  "barutti-oh-my-deer": ["weird"],
  "barutti-preverso": ["amber"],

  // Bepolar
  bepolar: ["weird"],

  // Almost Human
  "almost-human-burning-bridges": ["woody"],
  "almost-human-dear-feature": ["amber"],
  "almost-human-desert-hope": ["amber"],
  "almost-human-ritual-code": ["weird"],
  "almost-human-silent-rain": ["aquatic"],

  // Floramara
  "floramara-erotico-70": ["amber"],
  "floramara-nitro-flora": ["floral"],
  "floramara-sete": ["aquatic"],

  // French Cowboy
  "french-cowboy-mezcal-chocolat": ["amber"],
  "french-cowboy-pear-pavlova": ["amber"],
  "french-cowboy-fig-lemonade": ["chypre"],
  "french-cowboy-vanilla-for-breakfast": ["amber"],

  // Zoologist
  "zoologist-cow": ["floral"],
  "zoologist-squid": ["aquatic"],
  "zoologist-portuguese-man-o-war": ["aquatic"],
  "zoologist-harvest-mouse": ["woody"],
  "zoologist-bee": ["amber"],
  "zoologist-penguin": ["aquatic"],
  "zoologist-tyrannosaurus-rex": ["weird"],
  "zoologist-snowy-owl": ["weird"],
  "zoologist-hummingbird": ["floral"],

  // Art Brüt
  "art-brut-german-angst": ["fougere"],
  "art-brut-weltschmerz": ["woody"],
  "art-brut-chasing-ghosts": ["woody"],
  "art-brut-wet-dreams": ["aquatic"],
  "art-brut-ubermut": ["weird"],
  "art-brut-disko-disko": ["woody"],
  "art-brut-turbulent-romantic": ["weird"],
  "art-brut-je-ne-regrette-rien": ["floral"],

  // Nuit Vagabonde
  "nuit-vagabonde-cuir-de-peau": ["woody"],
  "nuit-vagabonde-peau-de-cuir": ["amber"],
  "nuit-vagabonde-la-trace": ["woody"],

  // Spiritica
  "spiritica-lynch": ["woody"],
  "spiritica-yuzu-yakuza": ["weird"],
  "spiritica-mango-macumba": ["weird"],
  "spiritica-leonarda": ["amber"],
  "spiritica-jeffrey": ["weird"],
  "spiritica-weona": ["aquatic"],

  // Gravel
  "gravel-mans-cologne": ["fougere"],
  "gravel-across-the-ocean": ["amber"],
  "gravel-american-dream": ["fougere"],
  "gravel-46th-street": ["woody"],
  "gravel-hudson-river-ny": ["woody"],
  "gravel-hazel": ["chypre"],
  "gravel-eau-desire": ["amber"],
  "gravel-eau-devolution": ["floral"],
  "gravel-eau-dominance": ["woody"],
  "gravel-eau-daspiration": ["amber"],
  "gravel-eau-declat": ["floral"],
  "gravel-eau-divine": ["aquatic"],
  "gravel-mulholland-bloom": ["woody"],
};

export function getParfumScentFamilies(slug: string): ScentFamilySlug[] {
  return PARFUM_SCENT_FAMILIES[slug] ?? [];
}
