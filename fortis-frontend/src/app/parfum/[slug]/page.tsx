import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ParfumJsonLd } from "@/components/seo/ParfumJsonLd";
import { ParfumDetail } from "@/components/parfumdetail/ParfumDetail";
import { getParfumBySlug, KOLEKCIJA_ITEMS } from "@/data/parfumi";
import { toMetaDescription } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

const PARFUM_DESC_FALLBACK =
  "Podrobnosti parfuma v Fortis Niche Atelier, nišna parfumerija v Ljubljani.";

export function generateStaticParams() {
  return KOLEKCIJA_ITEMS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const parfum = getParfumBySlug(slug);
  if (!parfum) {
    return { title: "Ni najdeno", robots: { index: false, follow: false } };
  }

  const item = KOLEKCIJA_ITEMS.find((i) => i.slug === slug);
  const brand = item?.brand ?? "Fortis Niche Atelier";
  const description = toMetaDescription(parfum.description, PARFUM_DESC_FALLBACK);
  const ogTitle = `${parfum.name} · ${brand}`;

  return {
    title: parfum.name,
    description,
    openGraph: {
      type: "website",
      locale: "sl_SI",
      url: `/parfum/${slug}`,
      title: ogTitle,
      description,
      images: [
        {
          url: parfum.imageSrc,
          alt: `${parfum.name} – ${brand}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [parfum.imageSrc],
    },
    alternates: {
      canonical: `/parfum/${slug}`,
    },
  };
}

export default async function ParfumPage({ params }: Props) {
  const { slug } = await params;
  const parfum = getParfumBySlug(slug);
  if (!parfum) notFound();

  const item = KOLEKCIJA_ITEMS.find((i) => i.slug === slug);
  const brand = item?.brand ?? "Fortis Niche Atelier";

  return (
    <>
      <ParfumJsonLd
        slug={slug}
        name={parfum.name}
        description={parfum.description}
        imageSrc={parfum.imageSrc}
        brand={brand}
        metaLine1={parfum.metaLine1}
        metaLine2={parfum.metaLine2}
      />
      <ParfumDetail
        slug={slug}
        imageSrc={parfum.imageSrc}
        name={parfum.name}
        metaLine1={parfum.metaLine1}
        metaLine2={parfum.metaLine2}
        description={parfum.description}
        notes={parfum.notes}
        ingredients={parfum.ingredients}
      />
    </>
  );
}
