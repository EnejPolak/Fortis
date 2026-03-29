import { SITE_NAME } from "@/lib/site-brand";
import { getSiteUrl } from "@/lib/site";

export function ContactJsonLd() {
  const base = getSiteUrl();
  const url = `${base}/contact`;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": `${url}#contact`,
        url,
        name: `Kontakt | ${SITE_NAME}`,
        description: `Kontakt ${SITE_NAME} – nišna parfumerija v Ljubljani.`,
        isPartOf: { "@type": "WebSite", url: base, name: SITE_NAME },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Domov", item: base },
          { "@type": "ListItem", position: 2, name: "Kontakt", item: url },
        ],
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
