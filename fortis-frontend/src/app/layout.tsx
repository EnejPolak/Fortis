import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { CookieConsent } from "@/components/cookie-consent/CookieConsent";
import { Navbar } from "@/components/navbar/Navbar";
import { SiteJsonLd } from "@/components/seo/SiteJsonLd";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-brand";
import { getMetadataBase } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Fortis",
    "nišna parfumerija",
    "niche perfume",
    "parfumi Ljubljana",
    "parfumerija",
    "svetovanje parfumi",
    "kolekcija parfumov",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "perfume",
  icons: {
    icon: "/fortis.png",
    apple: "/fortis.png",
  },
  verification: {
    google: "wdfYRNTPeFt3kF60B7EzfC973OBpScNVlR9IDkDnaGU",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "sl_SI",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/fortis.png",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/fortis.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SiteJsonLd />
        <Navbar />
        {children}
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
