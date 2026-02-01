"use client";

import { Footer } from "@/components/footer/Footer";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { KOLEKCIJA_ITEMS } from "@/data/parfumi";

type HoverInfo = { brand: string; name: string } | null;

const ROW_SIZE = 3;
const ROWS = Array.from({ length: Math.ceil(KOLEKCIJA_ITEMS.length / ROW_SIZE) }, (_, i) =>
  KOLEKCIJA_ITEMS.slice(i * ROW_SIZE, (i + 1) * ROW_SIZE)
);

export default function KolekcijaPage() {
  const [activePerfume, setActivePerfume] = useState<HoverInfo>(null);

  return (
    <>
      <main className="site-content kolekcija-page">
        {activePerfume && (
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
              <Link
                key={item.slug}
                href={`/parfum/${item.slug}`}
                className="kolekcija-image-wrap"
                onMouseEnter={() => setActivePerfume({ brand: item.brand, name: item.name })}
                onMouseLeave={() => setActivePerfume(null)}
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
            ))}
          </div>
        ))}
      </main>
      <Footer />
    </>
  );
}
