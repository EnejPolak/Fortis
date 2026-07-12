"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartProvider";
import { buildOrderSummary } from "@/lib/checkout";
import { formatWinePrice, getWineBySlug } from "@/data/wine";
import styles from "./CartPage.module.css";

export function CartPage() {
  const router = useRouter();
  const { items, setQuantity, removeItem } = useCart();
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const lines = items
    .map((item) => {
      const wine = getWineBySlug(item.slug);
      if (!wine) return null;
      return { wine, quantity: item.quantity };
    })
    .filter(Boolean) as { wine: NonNullable<ReturnType<typeof getWineBySlug>>; quantity: number }[];

  const order = items.length ? buildOrderSummary(items) : null;

  const formatMoney = (cents: number) =>
    new Intl.NumberFormat("sl-SI", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  const handleCheckout = () => {
    if (!ageConfirmed || lines.length === 0) return;
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
              {lines.map(({ wine, quantity }) => (
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
                          disabled={quantity >= wine.maxQuantity}
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
                    {new Intl.NumberFormat("sl-SI", {
                      style: "currency",
                      currency: "EUR",
                    }).format((wine.priceCents * quantity) / 100)}
                  </p>
                </li>
              ))}
            </ul>

            <div className={styles.summary}>
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Vmesna vsota</span>
                  <span>{order ? formatMoney(order.subtotalCents) : "—"}</span>
                </div>
              </div>
              <p className={styles.summaryNote}>
                Prevzem ali dostavo izberete pri plačilu. Poštnina velja le pri dostavi.
              </p>
              <div className={styles.summaryTotal}>
                <p className={styles.totalLabel}>Skupaj</p>
                <p className={styles.totalValue}>
                  {order ? formatMoney(order.subtotalCents) : "—"}
                </p>
              </div>
            </div>

            <label className={styles.ageCheck}>
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
              />
              <span>Potrjujem, da sem star/a najmanj 18 let.</span>
            </label>

            <button
              type="button"
              className={styles.checkoutBtn}
              disabled={!ageConfirmed}
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
