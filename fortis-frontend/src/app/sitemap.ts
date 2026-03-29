import type { MetadataRoute } from "next";
import { KOLEKCIJA_ITEMS } from "@/data/parfumi";
import { getSiteUrl } from "@/lib/site";

const STATIC_PATHS = [
  "/",
  "/kolekcija",
  "/oNas",
  "/contact",
  "/svetovanje",
  "/delovni-cas",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));

  const parfumEntries: MetadataRoute.Sitemap = KOLEKCIJA_ITEMS.map((item) => ({
    url: `${base}/parfum/${item.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...parfumEntries];
}
