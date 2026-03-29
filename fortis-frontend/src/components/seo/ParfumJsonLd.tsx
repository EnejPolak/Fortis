import { SITE_NAME } from "@/lib/site-brand";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site";

type Props = {
  slug: string;
  name: string;
  description: string;
  imageSrc: string;
  brand: string;
  metaLine1: string;
  metaLine2: string;
};

function plainDescription(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 5000);
}

export function ParfumJsonLd({
  slug,
  name,
  description,
  imageSrc,
  brand,
  metaLine1,
  metaLine2,
}: Props) {
  const base = getSiteUrl();
  const parfumUrl = `${base}/parfum/${slug}`;
  const desc = plainDescription(description) || `${name} – ${brand}, ${SITE_NAME}.`;
  const imageUrl = toAbsoluteUrl(imageSrc);

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${parfumUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Domov",
            item: base,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Kolekcija",
            item: `${base}/kolekcija`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name,
            item: parfumUrl,
          },
        ],
      },
      {
        "@type": "Product",
        "@id": `${parfumUrl}#product`,
        name,
        description: desc,
        image: [imageUrl],
        sku: slug,
        url: parfumUrl,
        brand: { "@type": "Brand", name: brand },
        category: "Parfum",
        additionalProperty: [
          { "@type": "PropertyValue", name: "Volumen", value: metaLine1 },
          { "@type": "PropertyValue", name: "Tip", value: metaLine2 },
        ],
        offers: {
          "@type": "Offer",
          url: parfumUrl,
          availability: "https://schema.org/InStoreOnly",
          seller: { "@type": "Organization", name: SITE_NAME, url: base },
        },
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
