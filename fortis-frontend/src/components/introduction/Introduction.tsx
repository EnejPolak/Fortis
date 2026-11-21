import Image from "next/image";

export function Introduction() {
  return (
    <section className="intro-atelier phi-section relative w-full">
      {/* Mobile: full-bleed editorial image */}
      <div className="block w-full md:hidden">
        <Image
          src="/LanHeroIntruduction.png"
          alt="Fortis ni moda. Je namen."
          width={1080}
          height={1350}
          className="h-auto w-full object-cover object-top"
          sizes="100vw"
        />
      </div>

      {/* Desktop: major image / minor copy (φ) */}
      <div className="site-shell hidden md:grid phi-split intro-atelier-grid">
        <div className="phi-media intro-atelier-media">
          <Image
            src="/lan.jpeg"
            alt="Fortis Introduction"
            width={496}
            height={661}
            className="intro-atelier-image"
            sizes="(min-width: 1024px) 55vw, 62vw"
          />
        </div>
        <div className="phi-copy intro-atelier-copy">
          <div className="intro-atelier-headline">
            <div>Fortis ni moda.</div>
            <div>Je namen.</div>
          </div>
          <p className="intro-atelier-tagline">Ne ustvarjeno za trende</p>
          <div className="intro-atelier-body">
            Fortis ni ustvarjen, da bi bil opažen.
            Ustvarjen je, da ostane.

            Ne pripada času, trendu ali trenutku.
            Pripada tistim, ki razumejo vrednost redkosti.

            Fortis ni za vsakogar.
            Nikoli ne prosi za pozornost. Nikoli se ne razlaga.

            To niso parfumi za množico.
            So prisotnost. Podpis. Tiha moč.

            Če ga moraš razumeti, ni zate.
            Če ga čutiš, potem že veš.
          </div>
        </div>
      </div>
    </section>
  );
}
