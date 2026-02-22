"use client";

import { Footer } from "@/components/footer/Footer";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { KOLEKCIJA_ITEMS, getShortDescription } from "@/data/parfumi";

type HoverInfo = { brand: string; name: string } | null;

const ROW_SIZE = 3;
const ROWS = Array.from({ length: Math.ceil(KOLEKCIJA_ITEMS.length / ROW_SIZE) }, (_, i) =>
  KOLEKCIJA_ITEMS.slice(i * ROW_SIZE, (i + 1) * ROW_SIZE)
);

export default function KolekcijaPage() {
  const [activePerfume, setActivePerfume] = useState<HoverInfo>(null);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);

    update();
    mq.addEventListener?.("change", update);

    return () => {
      mq.removeEventListener?.("change", update);
    };
  }, []);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (!hash) return;

    const scrollToEl = () => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    scrollToEl();
    const t = setTimeout(scrollToEl, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <main className="site-content kolekcija-page">
        {canHover && activePerfume && (
          <div className="kolekcija-hover-info" aria-hidden="true">
            <div className="kolekcija-hover-brand">{activePerfume.brand}</div>
            <div className="kolekcija-hover-name">{activePerfume.name}</div>
          </div>
        )}
        {ROWS.map((rowItems, rowIndex) => (
          <div
            key={rowIndex}
            className={rowIndex === 0 ? "kolekcija-row" : "kolekcija-row kolekcija-row-offset"}
          >
            {rowItems.map((item) => (
              <div key={item.slug} id={item.slug} className="kolekcija-item-wrap">
                <Link
                  href={`/parfum/${item.slug}`}
                  className="kolekcija-image-wrap"
                  onMouseEnter={() => {
                    if (canHover) setActivePerfume({ brand: item.brand, name: item.name });
                  }}
                  onMouseLeave={() => {
                    if (canHover) setActivePerfume(null);
                  }}
                  onTouchStart={() => setActivePerfume(null)}
                >
                  {item.imageSrc.includes("%23") ? (
                    <img
                      src={item.imageSrc}
                      alt={item.alt}
                      width={437}
                      height={437}
                      className={item.imageClassName ?? "kolekcija-image"}
                    />
                  ) : (
                    <Image
                      src={item.imageSrc}
                      alt={item.alt}
                      width={437}
                      height={437}
                      className={item.imageClassName ?? "kolekcija-image"}
                      priority={rowIndex === 0 && rowItems.indexOf(item) < 3}
                    />
                  )}
                </Link>
                <div className="kolekcija-mobile-info">
                  <div className="kolekcija-mobile-name">{item.name}</div>
                  {getShortDescription(item.slug) ? (
                    <div className="kolekcija-mobile-desc">{getShortDescription(item.slug)}</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>
      <Footer />
    </>
  );
}
