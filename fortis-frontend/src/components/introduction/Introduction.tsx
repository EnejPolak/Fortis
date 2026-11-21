import Image from "next/image";

export function Introduction() {
  return (
    <section className="intro-atelier" aria-labelledby="intro-atelier-heading">
      <div className="intro-atelier-inner">
        <div className="intro-atelier-copy">
          <p className="intro-atelier-eyebrow">O Fortisu</p>

          <h2 id="intro-atelier-heading" className="intro-atelier-headline">
            Fortis ni moda.
            <br />
            Je namen.
          </h2>

          <p className="intro-atelier-tagline">Ne ustvarjeno za trende.</p>

          <p className="intro-atelier-body">
            Fortis ni ustvarjen, da bi bil opažen. Ustvarjen je, da ostane. Ne
            pripada času, trendu ali trenutku. Pripada tistim, ki razumejo
            vrednost redkosti.
          </p>

          <p className="intro-atelier-body">
            To niso parfumi za množico. So prisotnost. Podpis. Tiha moč.
          </p>

          <div className="intro-atelier-rule" aria-hidden="true" />

          <p className="intro-atelier-closing">Če ga čutiš, potem že veš.</p>
        </div>

        <div className="intro-atelier-media">
          <Image
            src="/lan.jpeg"
            alt="Fortis — black and white editorial portrait"
            width={3024}
            height={4032}
            className="intro-atelier-image"
            sizes="(min-width: 900px) 55vw, 100vw"
            priority={false}
          />
        </div>
      </div>
    </section>
  );
}
