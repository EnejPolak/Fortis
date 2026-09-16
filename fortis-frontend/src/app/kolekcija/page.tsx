"use client";

import { Footer } from "@/components/footer/Footer";
import { KolekcijaBrandHeader } from "@/components/kolekcija/KolekcijaBrandHeader";
import { KolekcijaCollectionTransition } from "@/components/kolekcija/KolekcijaCollectionTransition";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { groupKolekcijaItemsByBrand } from "@/data/kolekcija-brands";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KOLEKCIJA_ITEMS, getShortDescription } from "@/data/parfumi";
import type { KolekcijaItem } from "@/data/parfumi";

type HoverInfo = { brand: string; name: string } | null;

const ROW_SIZE = 3;

function chunkRows(items: KolekcijaItem[]) {
  return Array.from({ length: Math.ceil(items.length / ROW_SIZE) }, (_, i) =>
    items.slice(i * ROW_SIZE, (i + 1) * ROW_SIZE)
  );
}

const BRAND_GROUPS = groupKolekcijaItemsByBrand(KOLEKCIJA_ITEMS);

export default function KolekcijaPage() {
  const [activePerfume, setActivePerfume] = useState<HoverInfo>(null);
  const [canHover, setCanHover] = useState(false);

  const prioritySlugs = useMemo(() => {
    const firstGroup = BRAND_GROUPS[0];
    if (!firstGroup) return new Set<string>();
    return new Set(firstGroup.items.slice(0, ROW_SIZE).map((item) => item.slug));
  }, []);

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
      <div className="site-content">
        <main className="kolekcija-page">
          {canHover && activePerfume && (
            <div className="kolekcija-hover-info" aria-hidden="true">
              <div className="kolekcija-hover-brand">{activePerfume.brand}</div>
              <div className="kolekcija-hover-name">{activePerfume.name}</div>
            </div>
          )}
          {BRAND_GROUPS.map((group, brandIndex) => {
            const rows = chunkRows(group.items);

            return (
              <section
                key={group.brand}
                className="kolekcija-brand-section"
                aria-label={group.meta.displayName}
              >
                {brandIndex > 0 ? <KolekcijaCollectionTransition /> : null}
                <KolekcijaBrandHeader meta={group.meta} />
                <div className="kolekcija-brand-products">
                  {rows.map((rowItems, rowIndex) => (
                    <div key={`${group.brand}-${rowIndex}`} className="kolekcija-row">
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
                                priority={prioritySlugs.has(item.slug)}
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
                </div>
              </section>
            );
          })}
        </main>
        <NewsletterSignup />
      </div>
      <Footer />
    </>
  );
}
