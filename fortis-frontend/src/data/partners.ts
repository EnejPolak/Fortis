/** Bump when replacing files in public/partnerji/ (clears browser + Next image cache). */
export const PARTNER_ASSET_VERSION = "3";

export type PartnerLogo = {
  name: string;
  src: string;
  width: number;
  height: number;
  /** Normalized display height (px) — balances visual weight */
  displayHeight: number;
};

function partnerSrc(path: string): string {
  return `${path}?v=${PARTNER_ASSET_VERSION}`;
}

export const PARTNER_LOGOS: PartnerLogo[] = [
  { name: "BMW", src: partnerSrc("/partnerji/bmw.webp"), width: 120, height: 120, displayHeight: 80 },
  {
    name: "Cosmopolitan",
    src: partnerSrc("/partnerji/cosmopolitan.avif"),
    width: 200,
    height: 48,
    displayHeight: 38,
  },
  {
    name: "Nemško-slovenska gospodarska zbornica (AHK DESLO)",
    src: partnerSrc("/partnerji/ahk-deslo.png"),
    width: 200,
    height: 56,
    displayHeight: 72,
  },
  {
    name: "Porsche Slovenija",
    src: partnerSrc("/partnerji/porsche-slovenija.png"),
    width: 220,
    height: 56,
    displayHeight: 62,
  },
  { name: "Reja", src: partnerSrc("/partnerji/reja.png"), width: 120, height: 48, displayHeight: 58 },
  { name: "Večer", src: partnerSrc("/partnerji/vecer.webp"), width: 140, height: 48, displayHeight: 44 },
];
