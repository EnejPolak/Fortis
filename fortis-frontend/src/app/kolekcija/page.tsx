"use client";

import { Footer } from "@/components/footer/Footer";
import Image from "next/image";
import { useState } from "react";

export default function KolekcijaPage() {
  const [activePerfume, setActivePerfume] = useState<string | null>(null);

  return (
    <>
      <main className="site-content kolekcija-page">
        {activePerfume && (
          <div className="kolekcija-hover-info" aria-hidden="true">
            <div className="kolekcija-hover-brand">Kinetic Parfums Barcelona</div>
            <div className="kolekcija-hover-name">{activePerfume}</div>
          </div>
        )}
        <div className="kolekcija-row">
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume("Aura")}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Kinetic/Aura.png"
              alt="Aura"
              width={437}
              height={437}
              className="kolekcija-image"
              priority
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume("Insomnia")}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Kinetic/Insomnia.png"
              alt="Insomnia"
              width={437}
              height={437}
              className="kolekcija-image"
              priority
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume("Kayu")}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Kinetic/Kayu.png"
              alt="Kayu"
              width={437}
              height={437}
              className="kolekcija-image"
              priority
            />
          </div>
        </div>
        <div className="kolekcija-row kolekcija-row-offset">
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume("Mosaic")}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Kinetic/Mosaic.png"
              alt="Mosaic"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume("Sillage")}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Kinetic/Sillage.png"
              alt="Sillage"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume("Verdigris")}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Kinetic/Verdigris.png"
              alt="Verdigris"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
