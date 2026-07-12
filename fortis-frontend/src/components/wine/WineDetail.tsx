"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartProvider";
import type { WineProduct } from "@/data/wine";
import { formatWinePrice } from "@/data/wine";
import { saveDirectCheckout } from "@/lib/direct-checkout";
import styles from "./WineDetail.module.css";

type WineDetailProps = {
  wine: WineProduct;
};

export function WineDetail({ wine }: WineDetailProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState<"buy" | "cart" | null>(null);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  const paragraphs = wine.description.split("\n\n").filter(Boolean);
  const lineTotal = new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
  }).format((wine.priceCents * quantity) / 100);

  const clampQty = (value: number) =>
    Math.max(1, Math.min(wine.maxQuantity, Math.floor(value)));

  const handleBuyNow = () => {
    if (!ageConfirmed || loading) return;
    setLoading("buy");
    setError("");
    setCartMessage("");
    saveDirectCheckout({ items: [{ slug: wine.slug, quantity }] });
    router.push("/placilo");
  };

  const handleAddToCart = () => {
    if (!ageConfirmed || loading) return;
    addItem(wine.slug, quantity);
    setCartMessage(
      quantity === 1
        ? "Dodano v košarico."
        : `${quantity} steklenici dodani v košarico.`
    );
    setLoading("cart");
    setTimeout(() => {
      setLoading(null);
      router.push("/kosarica");
    }, 600);
  };

  return (
    <main className={styles.main}>
      <section className={styles.hero} aria-label={`${wine.name} ${wine.vintage}`}>
        <div className={styles.heroImageWrap}>
          <Image
            src={wine.heroImageSrc}
            alt={`${wine.name} ${wine.vintage}`}
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
        </div>
        <div className={styles.heroOverlay} aria-hidden="true" />
        <Link href="/" className={styles.backLink}>
          ← Nazaj na domov
        </Link>
        <div className={styles.heroCaption}>
          <p className={styles.eyebrow}>Fortis Selection</p>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{wine.name}</h1>
            <span className={styles.vintage}>{wine.vintage}</span>
          </div>
          <div className={styles.rule} aria-hidden="true" />
          <p className={styles.tagline}>{wine.tagline}</p>
        </div>
      </section>

      <section className={styles.body}>
        <div className={styles.bodyInner}>
          <div className={styles.metaRow}>
            <p className={styles.producer}>{wine.producer}</p>
            <p className={styles.price}>{formatWinePrice(wine)} / kos</p>
          </div>

          <div className={styles.copy}>
            {paragraphs.map((para) => (
              <p key={para.slice(0, 24)} className={styles.description}>
                {para}
              </p>
            ))}
          </div>

          <div className={styles.purchase}>
            <div className={styles.qtyRow}>
              <span className={styles.qtyLabel}>Količina</span>
              <div className={styles.qty}>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  aria-label="Zmanjšaj količino"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => clampQty(q - 1))}
                >
                  −
                </button>
                <span className={styles.qtyValue}>{quantity}</span>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  aria-label="Povečaj količino"
                  disabled={quantity >= wine.maxQuantity}
                  onClick={() => setQuantity((q) => clampQty(q + 1))}
                >
                  +
                </button>
              </div>
              <span className={styles.lineTotal}>Skupaj: {lineTotal}</span>
            </div>

            <label className={styles.ageCheck}>
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
              />
              <span>Potrjujem, da sem star/a najmanj 18 let.</span>
            </label>

            <p className={styles.checkoutHint}>
              Plačilo poteka na strani Fortis. Stripe varno obdela plačilo in pošlje
              potrdilo na email.
            </p>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.buyBtn}
                disabled={!ageConfirmed || loading !== null}
                onClick={handleBuyNow}
              >
                {loading === "buy" ? "Preusmerjanje …" : "Kupi zdaj"}
              </button>
              <button
                type="button"
                className={styles.cartBtn}
                disabled={!ageConfirmed || loading !== null}
                onClick={handleAddToCart}
              >
                {loading === "cart" ? "Dodajam …" : "Dodaj v košarico"}
              </button>
            </div>

            {cartMessage ? (
              <p className={styles.cartMessage} role="status">
                {cartMessage}
              </p>
            ) : null}

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
