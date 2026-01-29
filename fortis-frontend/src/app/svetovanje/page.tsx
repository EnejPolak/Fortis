import { Footer } from "@/components/footer/Footer";
import Image from "next/image";

const SVETOVANJE_PONUDBE = [
  {
    naslov: "Vodeno svetovanje za eno osebo",
    opis:
      "Ponujamo osebno, eno-na-eno svetovanje, kjer skupaj odkrivamo tvoje preference, vonjne spomine in karakter. V mirnem in zasebnem okolju te vodim skozi selekcijo izbranih dišav in ti pomagam najti tisto, ki te najbolj predstavlja. Svetovanje je popolnoma prilagojeno posamezniku in zasnovano kot edinstvena, poglobljena izkušnja.",
    cena: "128,1 €",
  },
  {
    naslov: "Svetovanje za skupine",
    opis:
      "Svetovanje za skupine je izkušnja, kjer se eleganca preplete z dinamiko. Vodeno spoznavanje vonjnih svetov spodbuja dialog, odpira perspektive in krepi povezanost v skupini.",
    cena: "555 €",
  },
  {
    naslov: "Svetovanje za podjetja",
    opis:
      "Svetovanje za podjetja je strateško zasnovano: dišava kot del identitete, kultura skozi subtilen podpis. Prefinjena pot do vtisa, ki ostane – profesionalno, jasen, brez kompromisov.",
    cena: "725 €",
  },
];

export default function SvetovanjePage() {
  return (
    <>
      <main className="site-content svetovanje-page">
        <div className="svetovanje-container">
          <section className="svetovanje-hero">
            <div className="svetovanje-hero-logo">
              <Image
                src="/fortis.png"
                alt="Fortis"
                width={1012}
                height={680}
                priority
                className="svetovanje-logo-img"
              />
            </div>
            <p className="svetovanje-hero-tagline">niche atelier</p>
          </section>

          <section className="svetovanje-content">
            <h1 className="svetovanje-heading">Svetovanje</h1>
            <p className="svetovanje-intro">
              Odkrij, kaj dobiš – osebno usmerjenost, skupinsko izkušnjo ali
              podjetniški podpis. Z vsakim paketom dobiš jasno vrednost in
              poglobljeno izkušnjo z dišavami.
            </p>

            <div className="svetovanje-list">
              {SVETOVANJE_PONUDBE.map(({ naslov, opis, cena }) => (
                <article key={naslov} className="svetovanje-card">
                  <h2 className="svetovanje-card-title">{naslov}</h2>
                  <p className="svetovanje-card-opis">{opis}</p>
                  <p className="svetovanje-card-cena">Cena z DDV {cena}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
