"use client";

import { Footer } from "@/components/footer/Footer";
import { CollectionFilters } from "@/components/kolekcija/CollectionFilters";
import { KolekcijaBrandHeader } from "@/components/kolekcija/KolekcijaBrandHeader";
import { KolekcijaCollectionTransition } from "@/components/kolekcija/KolekcijaCollectionTransition";
import { useKolekcijaFilterUrl } from "@/components/kolekcija/useKolekcijaFilterUrl";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { groupKolekcijaItemsByBrand } from "@/data/kolekcija-brands";
import {
  filterKolekcijaItems,
  getBrandFilterOptions,
} from "@/lib/kolekcija-filter";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo } from "react";
import { KOLEKCIJA_ITEMS } from "@/data/parfumi";
import { formatParfumPrice, getParfumPriceEur } from "@/lib/parfum-prices";
import type { KolekcijaItem } from "@/data/parfumi";

const ROW_SIZE = 3;

function chunkRows(items: KolekcijaItem[]) {
  return Array.from({ length: Math.ceil(items.length / ROW_SIZE) }, (_, i) =>
    items.slice(i * ROW_SIZE, (i + 1) * ROW_SIZE)
  );
}

function KolekcijaPageContent() {
  const { filters, setFilters } = useKolekcijaFilterUrl();

  const brandOptions = useMemo(() => getBrandFilterOptions(KOLEKCIJA_ITEMS), []);

  const filteredItems = useMemo(
    () => filterKolekcijaItems(KOLEKCIJA_ITEMS, filters),
    [filters]
  );

  const brandGroups = useMemo(() => groupKolekcijaItemsByBrand(filteredItems), [filteredItems]);

  const prioritySlugs = useMemo(() => {
    const firstGroup = brandGroups[0];
    if (!firstGroup) return new Set<string>();
    return new Set(firstGroup.items.slice(0, ROW_SIZE).map((item) => item.slug));
  }, [brandGroups]);

  const filterKey = `${filters.brands.join(",")}|${filters.families.join(",")}`;

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
  }, [filterKey]);

  return (
    <>
      <div className="site-content">
        <main className="kolekcija-page">
          <CollectionFilters
            filters={filters}
            onChange={setFilters}
            brandOptions={brandOptions}
            resultCount={filteredItems.length}
          />

          <div key={filterKey} className="kolekcija-results">
            {brandGroups.length === 0 ? (
              <div className="kolekcija-filter-empty">
                <p className="kolekcija-filter-empty-text">
                  Noben parfum ne ustreza izbranim filtrom.
                </p>
                <button
                  type="button"
                  className="kolekcija-filter-empty-reset"
                  onClick={() => setFilters({ brands: [], families: [] })}
                >
                  Ponastavi filtre
                </button>
              </div>
            ) : null}

            {brandGroups.map((group, brandIndex) => {
              const rows = chunkRows(group.items);
              const isFirstVisibleSection = brandIndex === 0;

              return (
                <section
                  key={group.brand}
                  className="kolekcija-brand-section"
                  aria-label={group.meta.displayName}
                >
                  {!isFirstVisibleSection ? <KolekcijaCollectionTransition /> : null}
                  <KolekcijaBrandHeader meta={group.meta} />
                  <div className="kolekcija-brand-products">
                    {rows.map((rowItems, rowIndex) => (
                      <div key={`${group.brand}-${rowIndex}`} className="kolekcija-row">
                        {rowItems.map((item) => (
                          <Link
                            key={item.slug}
                            id={item.slug}
                            href={`/parfum/${item.slug}`}
                            className="kolekcija-item-wrap"
                          >
                            <span className="kolekcija-image-wrap">
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
                            </span>
                            <span className="kolekcija-card-info">
                              <span className="kolekcija-card-name">{item.name}</span>
                              {getParfumPriceEur(item.slug) != null ? (
                                <span className="kolekcija-card-price">
                                  {formatParfumPrice(getParfumPriceEur(item.slug)!)}
                                </span>
                              ) : null}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </main>
        <NewsletterSignup />
      </div>
      <Footer />
    </>
  );
}

export default function KolekcijaPage() {
  return (
    <Suspense fallback={null}>
      <KolekcijaPageContent />
    </Suspense>
  );
}
