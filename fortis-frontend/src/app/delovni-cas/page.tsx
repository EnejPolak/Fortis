import { Footer } from "@/components/footer/Footer";
import Image from "next/image";

const DELOVNI_CAS = [
  { dan: "Ponedeljek", en: "Monday", ura: "10:00 – 18:00" },
  { dan: "Torek", en: "Tuesday", ura: "10:00 – 18:00" },
  { dan: "Sreda", en: "Wednesday", ura: "10:00 – 18:00" },
  { dan: "Četrtek", en: "Thursday", ura: "10:00 – 18:00" },
  { dan: "Petek", en: "Friday", ura: "10:00 – 18:00" },
  { dan: "Sobota", en: "Saturday", ura: "10:00 – 18:00" },
  { dan: "Nedelja", en: "Sunday", ura: "Zaprto" },
];

export default function DelovniCasPage() {
  return (
    <>
      <main className="site-content delovni-cas-page">
        <div className="delovni-cas-container">
          <section className="delovni-cas-hero">
            <div className="delovni-cas-hero-logo">
              <Image
                src="/fortis.png"
                alt="Fortis"
                width={1012}
                height={680}
                priority
                className="delovni-cas-logo-img"
              />
            </div>
            <p className="delovni-cas-hero-tagline">niche atelier</p>
          </section>

          <section className="delovni-cas-content">
            <h1 className="delovni-cas-heading">Delovni čas</h1>
            <ul className="delovni-cas-list">
              {DELOVNI_CAS.map(({ dan, en, ura }) => (
                <li key={dan} className="delovni-cas-list-item">
                  <span className="delovni-cas-dan">{dan}</span>
                  <span className="delovni-cas-en">({en})</span>
                  <span className="delovni-cas-ura">{ura}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
