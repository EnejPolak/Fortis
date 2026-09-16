import type { ScentFamilySlug } from "./scent-families";

/** Scent families per parfum slug. Dopolnjuj po potrebi. */
export const PARFUM_SCENT_FAMILIES: Partial<Record<string, ScentFamilySlug[]>> = {
  "zoologist-cow": ["floral", "fougere", "woody"],
  "zoologist-squid": ["aquatic", "amber", "weird"],
  "zoologist-portuguese-man-o-war": ["aquatic", "weird", "floral"],
  "zoologist-harvest-mouse": ["woody", "amber", "floral"],
  "zoologist-bee": ["floral", "amber"],
  "zoologist-penguin": ["aquatic", "woody"],
  "zoologist-tyrannosaurus-rex": ["woody", "amber", "weird"],
  "zoologist-snowy-owl": ["floral", "chypre", "weird"],
  "zoologist-hummingbird": ["floral", "amber"],
  "art-brut-german-angst": ["fougere", "woody", "weird"],
  "art-brut-weltschmerz": ["woody", "amber", "floral"],
  "art-brut-chasing-ghosts": ["woody", "amber", "weird"],
  "art-brut-wet-dreams": ["aquatic", "floral", "chypre"],
};

export function getParfumScentFamilies(slug: string): ScentFamilySlug[] {
  return PARFUM_SCENT_FAMILIES[slug] ?? [];
}
