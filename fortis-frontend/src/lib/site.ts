/**
 * Za pravilne OG/sitemap URL-je v produkciji nastavi v Vercel (ali .env):
 * NEXT_PUBLIC_SITE_URL=https://tvoja-domena.si
 * Če ni nastavljeno, se na Vercelu uporabi VERCEL_URL.
 *
 * Opcijsko (Organization sameAs v JSON-LD):
 * NEXT_PUBLIC_INSTAGRAM_URL, NEXT_PUBLIC_FACEBOOK_URL
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function getMetadataBase(): URL {
  return new URL(`${getSiteUrl()}/`);
}

export function toAbsoluteUrl(path: string): string {
  return new URL(path.startsWith("/") ? path : `/${path}`, `${getSiteUrl()}/`).href;
}

export function getSameAsUrls(): string[] {
  const urls: string[] = [];
  const ig = process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim();
  const fb = process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim();
  if (ig) urls.push(ig);
  if (fb) urls.push(fb);
  return urls;
}
