import type { WineProduct } from "@/data/wine";
import { formatMoneyCents } from "@/data/wine";
import styles from "./WinePriceBreakdown.module.css";

type WinePriceBreakdownProps = {
  netCents: number;
  vatCents: number;
  grossCents: number;
  className?: string;
};

export function WinePriceBreakdown({
  netCents,
  vatCents,
  grossCents,
  className,
}: WinePriceBreakdownProps) {
  return (
    <div className={[styles.breakdown, className].filter(Boolean).join(" ")}>
      <div className={styles.row}>
        <span>Brez DDV</span>
        <span>{formatMoneyCents(netCents)}</span>
      </div>
      <div className={styles.row}>
        <span>DDV</span>
        <span>{formatMoneyCents(vatCents)}</span>
      </div>
      <div className={`${styles.row} ${styles.total}`}>
        <span>Skupaj</span>
        <span>{formatMoneyCents(grossCents)}</span>
      </div>
    </div>
  );
}

export function wineUnitBreakdown(wine: WineProduct) {
  return {
    netCents: wine.priceNetCents,
    vatCents: wine.vatCents,
    grossCents: wine.priceCents,
  };
}

export function wineLineBreakdown(wine: WineProduct, quantity: number) {
  return {
    netCents: wine.priceNetCents * quantity,
    vatCents: wine.vatCents * quantity,
    grossCents: wine.priceCents * quantity,
  };
}
