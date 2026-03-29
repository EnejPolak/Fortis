import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-brand";
import { getSameAsUrls, getSiteUrl } from "@/lib/site";

export function SiteJsonLd() {
  const base = getSiteUrl();
  const orgId = `${base}/#organization`;
  const websiteId = `${base}/#website`;
  const storeId = `${base}/#store`;

  const sameAs = getSameAsUrls();
  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": orgId,
    name: SITE_NAME,
    url: base,
    logo: {
      "@type": "ImageObject",
      url: `${base}/fortis.png`,
      width: 1012,
      height: 680,
    },
    description: SITE_DESCRIPTION,
  };
  if (sameAs.length) organization.sameAs = sameAs;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: base,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "sl-SI",
        publisher: { "@id": orgId },
        isPartOf: { "@id": orgId },
      },
      {
        "@type": ["Store", "LocalBusiness"],
        "@id": storeId,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        url: base,
        image: `${base}/fortis.png`,
        parentOrganization: { "@id": orgId },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          url: `${base}/contact`,
          availableLanguage: ["Slovenian", "English"],
        },
        areaServed: {
          "@type": "AdministrativeArea",
          name: "Ljubljana",
          containedInPlace: { "@type": "Country", name: "Slovenia" },
        },
        priceRange: "$$",
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
