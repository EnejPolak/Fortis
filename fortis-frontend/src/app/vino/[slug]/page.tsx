import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer/Footer";
import { WineDetail } from "@/components/wine/WineDetail";
import { WineOutOfStock } from "@/components/wine/WineOutOfStock";
import { getAllWineSlugs, getWineBySlug } from "@/data/wine";
import { getStock } from "@/lib/inventory";
import { toMetaDescription } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllWineSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const wine = getWineBySlug(slug);
  if (!wine) {
    return { title: "Ni najdeno", robots: { index: false, follow: false } };
  }

  const description = toMetaDescription(wine.description, wine.tagline);
  const title = `${wine.name} ${wine.vintage}`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Fortis Niche Atelier`,
      description,
      url: `/vino/${slug}`,
      images: [{ url: wine.imageSrc, alt: title }],
    },
    alternates: { canonical: `/vino/${slug}` },
  };
}

export default async function VinoPage({ params }: Props) {
  const { slug } = await params;
  const wine = getWineBySlug(slug);
  if (!wine) notFound();

  const stock = await getStock(slug);

  return (
    <>
      {stock === 0 ? (
        <WineOutOfStock wine={wine} />
      ) : (
        <WineDetail wine={wine} stock={stock} />
      )}
      <Footer />
    </>
  );
}
