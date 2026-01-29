"use client";

import { Footer } from "@/components/footer/Footer";
import Image from "next/image";
import { useState } from "react";

type HoverInfo = { brand: string; name: string } | null;

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
        <div className="kolekcija-row">
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Kinetic Parfums Barcelona", name: "Aura" })}
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
            onMouseEnter={() => setActivePerfume({ brand: "Kinetic Parfums Barcelona", name: "Insomnia" })}
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
            onMouseEnter={() => setActivePerfume({ brand: "Kinetic Parfums Barcelona", name: "Kayu" })}
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
            onMouseEnter={() => setActivePerfume({ brand: "Kinetic Parfums Barcelona", name: "Mosaic" })}
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
            onMouseEnter={() => setActivePerfume({ brand: "Kinetic Parfums Barcelona", name: "Sillage" })}
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
            onMouseEnter={() => setActivePerfume({ brand: "Kinetic Parfums Barcelona", name: "Verdigris" })}
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
        {/* Hedonik – 3. vrstica */}
        <div className="kolekcija-row kolekcija-row-offset">
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Hedonik", name: "Divine Perversion" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Hedonik/DivinePerversion.webp"
              alt="Divine Perversion"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Hedonik", name: "Exquisite Affair" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Hedonik/ExquisiteAffair.png"
              alt="Exquisite Affair"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Hedonik", name: "Obsessive Devotion" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Hedonik/ObsessiveDevotion.webp"
              alt="Obsessive Devotion"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
        </div>
        <div className="kolekcija-row kolekcija-row-offset">
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Meo Fusciuni", name: "Nota Di Viaggio 1" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <img
              src="/Meo/1%23NotaDiViaggio.png"
              alt="Nota Di Viaggio 1"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Meo Fusciuni", name: "Sogni" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Meo/Sogni.png"
              alt="Sogni"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Meo Fusciuni", name: "Narcotico" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Meo/Narcotico.png"
              alt="Narcotico"
              width={437}
              height={437}
              className="kolekcija-image kolekcija-image-narcotico"
            />
          </div>
        </div>
        <div className="kolekcija-row kolekcija-row-offset">
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Meo Fusciuni", name: "Notturno" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Meo/Notturno.png"
              alt="Notturno"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Meo Fusciuni", name: "Varanasi" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Meo/Varanasi.png"
              alt="Varanasi"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Meo Fusciuni", name: "LittleSong" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Meo/LittleSong.png"
              alt="LittleSong"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
        </div>
        <div className="kolekcija-row kolekcija-row-offset">
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Meo Fusciuni", name: "Nota Di Viaggio 2" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <img
              src="/Meo/2%23NotaDiViaggio.png"
              alt="Nota Di Viaggio 2"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Meo Fusciuni", name: "Odor93" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Meo/Odor93.png"
              alt="Odor93"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Headspace", name: "Absinth" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Headspace/absinth.webp"
              alt="Absinth"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
        </div>
        {/* Headspace – vrstica 1: 3 zapolnjena */}
        <div className="kolekcija-row kolekcija-row-offset">
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Headspace", name: "Genviere" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Headspace/Genviere.png"
              alt="Genviere"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Headspace", name: "Kirsch" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Headspace/kirsch.webp"
              alt="Kirsch"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Headspace", name: "Myrrhe" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Headspace/Myrrhe.png"
              alt="Myrrhe"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
        </div>
        {/* Headspace – vrstica 2: 3 zapolnjena */}
        <div className="kolekcija-row kolekcija-row-offset">
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Headspace", name: "Santal" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Headspace/santal.webp"
              alt="Santal"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Headspace", name: "Sauge" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Headspace/Sauge.png"
              alt="Sauge"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Headspace", name: "Syrax" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Headspace/Syrax.png"
              alt="Syrax"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
        </div>
        {/* Headspace – vrstica 3: 3 zapolnjena */}
        <div className="kolekcija-row kolekcija-row-offset">
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Headspace", name: "Tubereuse" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Headspace/tubereuse.png"
              alt="Tubereuse"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Barutti", name: "Berlin in Winter" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Barutti/BerlininWinter.png"
              alt="Berlin in Winter"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Barutti", name: "Chai" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Barutti/Chai.png"
              alt="Chai"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
        </div>
        {/* Barutti – vrstica 1: 3 zapolnjena */}
        <div className="kolekcija-row kolekcija-row-offset">
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Barutti", name: "Dama Koupa" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Barutti/Dama%20Koupa.png"
              alt="Dama Koupa"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Barutti", name: "Nooud" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Barutti/Nooud.png"
              alt="Nooud"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Barutti", name: "Oh My Deer" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Barutti/OhMyDeer.png"
              alt="Oh My Deer"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
        </div>
        {/* Barutti + Bepolar – zadnja vrstica, Bepolar na koncu */}
        <div className="kolekcija-row kolekcija-row-offset">
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Barutti", name: "Preverso" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Barutti/Preverso.png"
              alt="Preverso"
              width={437}
              height={437}
              className="kolekcija-image"
            />
          </div>
          <div
            className="kolekcija-image-wrap"
            onMouseEnter={() => setActivePerfume({ brand: "Bepolar", name: "Bepolar" })}
            onMouseLeave={() => setActivePerfume(null)}
          >
            <Image
              src="/Bepolar/Bepolar.png"
              alt="Bepolar"
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
