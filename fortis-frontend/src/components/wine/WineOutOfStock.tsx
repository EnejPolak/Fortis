import Image from "next/image";
import Link from "next/link";
import type { WineProduct } from "@/data/wine";
import styles from "./WineOutOfStock.module.css";

type WineOutOfStockProps = {
  wine: WineProduct;
};

export function WineOutOfStock({ wine }: WineOutOfStockProps) {
  const paragraphs = wine.description.split("\n\n").filter(Boolean);

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
          <div className={styles.badge} role="status">
            Trenutno razprodano
          </div>

          <p className={styles.message}>
            Žal trenutno ni na zalogi. Ko bo PRIMO spet na voljo, bo objavljeno na
            tej strani.
          </p>

          <div className={styles.metaRow}>
            <p className={styles.producer}>{wine.producer}</p>
          </div>

          <div className={styles.copy}>
            {paragraphs.map((para) => (
              <p key={para.slice(0, 24)} className={styles.description}>
                {para}
              </p>
            ))}
          </div>

          <div className={styles.actions}>
            <Link href="/" className={styles.homeBtn}>
              Nazaj na domov
            </Link>
            <Link href="/kontakt" className={styles.contactBtn}>
              Kontakt
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
