export const SCENT_FAMILY_SLUGS = [
  "floral",
  "aquatic",
  "woody",
  "fougere",
  "chypre",
  "amber",
  "weird",
] as const;

export type ScentFamilySlug = (typeof SCENT_FAMILY_SLUGS)[number];

export const SCENT_FAMILY_OPTIONS: { slug: ScentFamilySlug; label: string }[] = [
  { slug: "floral", label: "Floral" },
  { slug: "aquatic", label: "Aquatic" },
  { slug: "woody", label: "Woody" },
  { slug: "fougere", label: "Fougère" },
  { slug: "chypre", label: "Chypre" },
  { slug: "amber", label: "Oriental / Amber" },
  { slug: "weird", label: "Weird" },
];

export function isScentFamilySlug(value: string): value is ScentFamilySlug {
  return (SCENT_FAMILY_SLUGS as readonly string[]).includes(value);
}
