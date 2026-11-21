"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText, ScrollTrigger);

/* ——— Slike za scroll-reveal kartice ——— */
const IMAGES = [
  { src: "/Hero/lan2.jpeg", title: "Lan Kraševec" },
  { src: "/oNas/prostor.jpeg", title: "Fortis Niche Atelier" },
  // Dodaj 3. sliko tukaj ko bo pripravljena:
  // { src: "/oNas/tretja.jpeg", title: "Naslov" },
];

/* ——— SVG poti (identične kot v codegrid) ——— */
const SVG_PATH_1 =
  "M227.549 1818.76C227.549 1818.76 406.016 2207.75 569.049 2130.26C843.431 1999.85 -264.104 1002.3 227.549 876.262C552.918 792.849 773.647 2456.11 1342.05 2130.26C1885.43 1818.76 14.9644 455.772 760.548 137.262C1342.05 -111.152 1663.5 2266.35 2209.55 1972.76C2755.6 1679.18 1536.63 384.467 1826.55 137.262C2013.5 -22.1463 2209.55 381.262 2209.55 381.262";

const SVG_PATH_2 =
  "M1661.28 2255.51C1661.28 2255.51 2311.09 1960.37 2111.78 1817.01C1944.47 1696.67 718.456 2870.17 499.781 2255.51C308.969 1719.17 2457.51 1613.83 2111.78 963.512C1766.05 313.198 427.949 2195.17 132.281 1455.51C-155.219 736.292 2014.78 891.514 1708.78 252.012C1437.81 -314.29 369.471 909.169 132.281 566.512C18.1772 401.672 244.781 193.012 244.781 193.012";

/* ——— Barve potez za vsako kartico ——— */
const STROKE_COLORS = ["	#c0c0c0", "#023020", "#e67339"];
const BASE_STROKE = "#28282B";

export default function ONas() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const splits: InstanceType<typeof SplitText>[] = [];

    const ctx = gsap.context(() => {
      cardRefs.current.forEach((cardContainer) => {
        if (!cardContainer) return;

        const cardPaths =
          cardContainer.querySelectorAll<SVGPathElement>(".svg-stroke path");
        const cardTitle =
          cardContainer.querySelector<HTMLElement>(".card-title h3");

        if (!cardTitle || cardPaths.length === 0) return;

        const split = SplitText.create(cardTitle, {
          type: "words",
          mask: "words",
          wordsClass: "word",
        });
        splits.push(split);

        gsap.set(split.words, { yPercent: 100 });

        const pathLengths: number[] = [];
        cardPaths.forEach((path) => {
          const length = path.getTotalLength();
          pathLengths.push(length);
          path.style.strokeDasharray = `${length}`;
          path.style.strokeDashoffset = "0";
        });

        gsap.set(cardPaths, { attr: { "stroke-width": 700 } });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: cardContainer,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });

        cardPaths.forEach((path, index) => {
          tl.to(
            path,
            {
              strokeDashoffset: pathLengths[index],
              attr: { "stroke-width": 200 },
              duration: 2,
              ease: "power2.inOut",
            },
            0
          );
        });

        tl.to(
          split.words,
          {
            yPercent: 0,
            duration: 1.15,
            ease: "power2.out",
            stagger: 0.11,
          },
          0.55
        );
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      splits.forEach((s) => s.revert());
    };
  }, []);

  return (
    <section ref={sectionRef}>
      <div className="o-nas-hero">
        <h2 className="o-nas-title">
          Vsaka dišava tukaj ima razlog&nbsp; zgodbo, izvor in človeka, ki jo
          zna postaviti na pravo mesto.
        </h2>
      </div>

      <div className="o-nas-cards">
        {Array.from({ length: Math.ceil(IMAGES.length / 2) }, (_, rowIdx) => {
          const pair = IMAGES.slice(rowIdx * 2, rowIdx * 2 + 2);
          return (
            <div key={rowIdx} className="o-nas-row">
              {pair.map((img, colIdx) => {
                const flatIdx = rowIdx * 2 + colIdx;
                const strokeColor = STROKE_COLORS[flatIdx % STROKE_COLORS.length];
                const sizeClass =
                  pair.length === 2
                    ? colIdx === 0
                      ? "o-nas-card--major"
                      : "o-nas-card--minor"
                    : "";
                const elements = [];

                elements.push(
                  <div
                    key={img.src}
                    ref={(el) => {
                      if (el) cardRefs.current[flatIdx] = el;
                    }}
                    className={`o-nas-card ${sizeClass}`.trim()}
                  >
                    <div style={{ width: "100%", height: "100%" }}>
                      <img
                        src={img.src}
                        alt={img.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>

                    <div
                      className="svg-stroke svg-stroke-1"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%) scale(1.5)",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <svg
                        width="2453"
                        height="2273"
                        viewBox="0 0 2453 2273"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ width: "100%", height: "100%" }}
                      >
                        <path
                          d={SVG_PATH_1}
                          stroke={strokeColor}
                          strokeWidth="200"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <div
                      className="svg-stroke svg-stroke-2"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%) scale(1.5)",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <svg
                        width="2250"
                        height="2535"
                        viewBox="0 0 2250 2535"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ width: "100%", height: "100%" }}
                      >
                        <path
                          d={SVG_PATH_2}
                          stroke={BASE_STROKE}
                          strokeWidth="200"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <div
                      className="card-title"
                      style={{
                        position: "absolute",
                        bottom: "2rem",
                        left: "2rem",
                        color: "#ededed",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "clamp(1.75rem, 2.5vw, 2.75rem)",
                          fontWeight: 450,
                          lineHeight: 1.25,
                          letterSpacing: "-0.025rem",
                        }}
                      >
                        {img.title}
                      </h3>
                    </div>
                  </div>
                );

                if (flatIdx === 0) {
                  elements.push(
                    <div
                      key="mobile-lan-text"
                      className="o-nas-mobile-text"
                      style={{
                        display: "none",
                        padding: "2.5rem 0 3.5rem",
                        lineHeight: 1.6,
                        textAlign: "justify",
                        textAlignLast: "left",
                        hyphens: "auto",
                      }}
                    >
                      <p>
                        Lan Kraševec je obraz Fortis Niche Atelier in ambasador nišne
                        parfumerije z dolgoletnimi izkušnjami profesionalnega svetovanja v svetu
                        artisanal dišav. Njegov pristop temelji na zgodbi: kaj parfum pomeni, od
                        kod prihaja, in zakaj določena hiša izstopa. Svoje znanje in naravno
                        sposobnost pripovedovanja je dokazal tudi na različnih dogodkih, kjer je
                        ljudi pritegnil z iskrenimi vpogledi v svet dišav. Fortis je ustanovil z
                        idejo ustvariti prostor, kjer se luksuz ne meri v glasnosti, ampak v
                        kakovosti izbire, miru in avtentični povezavi z dišavo.
                      </p>
                    </div>
                  );
                }

                return elements;
              })}
            </div>
          );
        })}
      </div>

      <div className="o-nas-text-block o-nas-text-block-lan">
        <p>
          Lan Kraševec je obraz Fortis Niche Atelier in ambasador nišne
          parfumerije z dolgoletnimi izkušnjami profesionalnega svetovanja v svetu
          artisanal dišav. Njegov pristop temelji na zgodbi: kaj parfum pomeni, od
          kod prihaja, in zakaj določena hiša izstopa. Svoje znanje in naravno
          sposobnost pripovedovanja je dokazal tudi na različnih dogodkih, kjer je
          ljudi pritegnil z iskrenimi vpogledi v svet dišav. Fortis je ustanovil z
          idejo ustvariti prostor, kjer se luksuz ne meri v glasnosti, ampak v
          kakovosti izbire, miru in avtentični povezavi z dišavo.
        </p>
      </div>

      <div className="o-nas-text-block o-nas-text-block-atelier">
        <p>
          Fortis Niche Atelier je nišna parfumerija v središču Ljubljane za
          ljudi, ki hočejo več kot hitro testiranje na listič. Ne delujemo kot
          klasična trgovina. Pri nas dobiš osebno svetovanje in izbor dišav, ki
          se ti dejansko prilegajo. Fokus je na značaju, zgodbi in tem, kako
          parfum deluje na tvoji koži.
        </p>
      </div>
    </section>
  );
}
