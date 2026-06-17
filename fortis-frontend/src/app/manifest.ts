import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-brand";

const FAVICON_IMAGE = "/fortis-favicon.webp";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Fortis",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "sl",
    dir: "ltr",
    icons: [
      {
        src: FAVICON_IMAGE,
        sizes: "256x256",
        type: "image/webp",
        purpose: "any",
      },
    ],
  };
}
