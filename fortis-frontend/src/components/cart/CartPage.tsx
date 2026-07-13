"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartProvider";
import { buildOrderSummary } from "@/lib/checkout";
import { formatMoneyCents, formatWinePrice, getWineBySlug } from "@/data/wine";
import { WinePriceBreakdown } from "@/components/wine/WinePriceBreakdown";
import styles from "./CartPage.module.css";

export function CartPage() {
  const router = useRouter();
  const { items, setQuantity, removeItem, maxQuantityFor, stockBySlug } = useCart();
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const lines = items
    .map((item) => {
      const wine = getWineBySlug(item.slug);
      if (!wine) return null;
      return { wine, quantity: item.quantity };
    })
    .filter(Boolean) as { wine: NonNullable<ReturnType<typeof getWineBySlug>>; quantity: number }[];

  const order = items.length ? buildOrderSummary(items) : null;

  const stockWarnings = lines
    .map(({ wine, quantity }) => {
      const stock = stockBySlug[wine.slug];
      const max = maxQuantityFor(wine.slug);
      if (stock === 0) {
        return `${wine.name} ${wine.vintage} je trenutno razprodano.`;
      }
      if (stock !== undefined && quantity > stock) {
        return `Na zalogi je le ${stock} ${stock === 1 ? "kos" : "kosov"} ${wine.name} ${wine.vintage}.`;
      }
      if (quantity > max) {
        return `Največ ${max} kosov na naročilo za ${wine.name} ${wine.vintage}.`;
      }
      return null;
    })
    .filter(Boolean) as string[];

  const hasStockIssue = stockWarnings.length > 0;

  const handleCheckout = () => {
    if (!ageConfirmed || lines.length === 0 || hasStockIssue) return;
    router.push("/placilo");
  };

  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <Link href="/" className={styles.backLink}>
          ← Nazaj na domov
        </Link>
        <p className={styles.eyebrow}>Fortis Selection</p>
        <h1 className={styles.title}>Košarica</h1>
        <p className={styles.hint}>
          Prijava ni potrebna. Na naslednji strani vnesete podatke in plačate prek
          Stripe — potrdilo prejmete po emailu.
        </p>

        {lines.length === 0 ? (
          <div className={styles.empty}>
            <p>Košarica je prazna.</p>
            <Link href="/vino/primo" className={styles.shopLink}>
              Odkrij PRIMO
            </Link>
          </div>
        ) : (
          <>
            <ul className={styles.list}>
              {lines.map(({ wine, quantity }) => {
                const maxQty = maxQuantityFor(wine.slug);
                const stock = stockBySlug[wine.slug];

                return (
                <li key={wine.slug} className={styles.line}>
                  <div className={styles.lineImage}>
                    <Image
                      src={wine.imageSrc}
                      alt={`${wine.name} ${wine.vintage}`}
                      width={72}
                      height={108}
                      className={styles.thumb}
                    />
                  </div>
                  <div className={styles.lineBody}>
                    <p className={styles.lineName}>
                      {wine.name} {wine.vintage}
                    </p>
                    <p className={styles.linePrice}>{formatWinePrice(wine)} / kos</p>
                    {stock !== undefined ? (
                      <p className={styles.stockHint}>
                        Na zalogi: {stock} {stock === 1 ? "kos" : "kosov"}
                      </p>
                    ) : null}
                    <div className={styles.lineActions}>
                      <div className={styles.qty}>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          aria-label="Zmanjšaj količino"
                          onClick={() => setQuantity(wine.slug, quantity - 1)}
                        >
                          −
                        </button>
                        <span className={styles.qtyValue}>{quantity}</span>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          aria-label="Povečaj količino"
                          disabled={quantity >= maxQty}
                          onClick={() => setQuantity(wine.slug, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeItem(wine.slug)}
                      >
                        Odstrani
                      </button>
                    </div>
                  </div>
                  <p className={styles.lineTotal}>
                    {formatMoneyCents(wine.priceCents * quantity)}
                  </p>
                </li>
              );
              })}
            </ul>

            <div className={styles.summary}>
              {order ? (
                <WinePriceBreakdown
                  netCents={order.netSubtotalCents}
                  vatCents={order.vatSubtotalCents}
                  grossCents={order.subtotalCents}
                  className={styles.summaryBreakdown}
                />
              ) : null}
              <p className={styles.summaryNote}>
                Prevzem ali dostavo izberete pri plačilu. Poštnina velja le pri dostavi.
              </p>
            </div>

            <label className={styles.ageCheck}>
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
              />
              <span>Potrjujem, da sem star/a najmanj 18 let.</span>
            </label>

            {stockWarnings.length > 0 ? (
              <div className={styles.stockAlert} role="alert">
                {stockWarnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              className={styles.checkoutBtn}
              disabled={!ageConfirmed || hasStockIssue}
              onClick={handleCheckout}
            >
              Na plačilo
            </button>
          </>
        )}
      </div>
    </main>
  );
}
