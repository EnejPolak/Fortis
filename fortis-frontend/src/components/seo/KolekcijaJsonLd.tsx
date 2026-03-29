import { KOLEKCIJA_ITEMS } from "@/data/parfumi";
import { SITE_NAME } from "@/lib/site-brand";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site";

export function KolekcijaJsonLd() {
  const base = getSiteUrl();
  const collectionUrl = `${base}/kolekcija`;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${collectionUrl}#collection`,
        url: collectionUrl,
        name: `Kolekcija | ${SITE_NAME}`,
        description:
          "Kolekcija nišnih parfumov v Fortis Niche Atelier, Ljubljana. Prebrskaj znamke in dišave.",
        isPartOf: { "@type": "WebSite", url: base, name: SITE_NAME },
        mainEntity: {
          "@id": `${collectionUrl}#itemlist`,
        },
      },
      {
        "@type": "ItemList",
        "@id": `${collectionUrl}#itemlist`,
        numberOfItems: KOLEKCIJA_ITEMS.length,
        itemListElement: KOLEKCIJA_ITEMS.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Product",
            name: item.name,
            url: `${base}/parfum/${item.slug}`,
            image: toAbsoluteUrl(item.imageSrc),
            brand: { "@type": "Brand", name: item.brand },
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
