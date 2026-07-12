"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PRIMO_WINE } from "@/data/wine";
import styles from "./WineSpotlight.module.css";

gsap.registerPlugin(ScrollTrigger);

export function WineSpotlight() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(contentRef.current, {
        y: 48,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 72%",
          toggleActions: "play none none reverse",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const wine = PRIMO_WINE;

  return (
    <section ref={sectionRef} className={styles.section} aria-labelledby="wine-spotlight-title">
      <div className={styles.imageWrap}>
        <Image
          src={wine.heroImageSrc}
          alt={`${wine.name} ${wine.vintage}`}
          fill
          priority
          sizes="100vw"
          className={styles.image}
        />
      </div>
      <div className={styles.overlay} aria-hidden="true" />
      <div ref={contentRef} className={styles.content}>
        <p className={styles.eyebrow}>Fortis Selection</p>
        <div className={styles.titleRow}>
          <h2 id="wine-spotlight-title" className={styles.title}>
            {wine.name}
          </h2>
          <span className={styles.vintage}>{wine.vintage}</span>
        </div>
        <div className={styles.rule} aria-hidden="true" />
        <p className={styles.tagline}>{wine.tagline}</p>
        <p className={styles.producer}>{wine.producer}</p>
        <Link href={`/vino/${wine.slug}`} className={styles.cta}>
          Odkrij PRIMO
        </Link>
      </div>
    </section>
  );
}
