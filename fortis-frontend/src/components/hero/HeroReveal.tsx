"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";
import styles from "./HeroReveal.module.css";

gsap.registerPlugin(CustomEase, SplitText);
CustomEase.create("hop", "0.85, 0, 0.15, 1");

const HERO_IMAGES = [
  "/Hero/prostor.jpeg",
  "/lan.jpeg",
  "/Hero/FortisHero.png",
  "/Hero/LanIntruduction.jpeg",
  "/Hero/lan2.jpeg?v=20260212",
];

export function HeroReveal() {
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLElement | null>(null);
  const counterRef = useRef<HTMLHeadingElement | null>(null);
  const overlayTextRef = useRef<HTMLDivElement | null>(null);
  const imagesWrapRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const heroTitleRef = useRef<HTMLHeadingElement | null>(null);
  const imageRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!rootRef.current || !counterRef.current || !heroTitleRef.current) return;

    const imgs = imageRefs.current.filter(Boolean);
    const sideImgs = imgs.filter((_, idx) => idx !== 2);
    const centerImg = imgs[2];

    const applyFinalState = () => {
      if (counterRef.current) counterRef.current.textContent = "100";
      if (overlayTextRef.current) gsap.set(overlayTextRef.current, { y: "-6rem" });
      if (imagesWrapRef.current) gsap.set(imagesWrapRef.current, { gap: "0.75vw" });
      gsap.set(imgs, { y: 0, opacity: 1, scale: 1 });
      gsap.set(sideImgs, { clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)" });
      if (centerImg) gsap.set(centerImg, { scale: 2 });
      if (overlayRef.current) {
        gsap.set(overlayRef.current, {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
        });
      }
    };

    const skipReveal = searchParams.get("skipReveal") === "1";
    if (skipReveal) {
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/");
      }
      applyFinalState();
      document.body.classList.remove("hero-reveal-lock-ui");
      return;
    }

    document.body.classList.add("hero-reveal-lock-ui");

    const ctx = gsap.context(() => {
      const split = SplitText.create(heroTitleRef.current, {
        type: "words",
        mask: "words",
        wordsClass: "word",
      });

      gsap.set(split.words, { yPercent: 100 });

      const counter = { value: 0 };
      const counterTl = gsap.timeline({ delay: 0.5 });
      const overlayTextTl = gsap.timeline({ delay: 0.75 });
      const revealTl = gsap.timeline({ delay: 0.5 });

      counterTl.to(counter, {
        value: 100,
        duration: 5,
        ease: "power2.out",
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.textContent = `${Math.floor(counter.value)}`;
          }
        },
      });

      if (overlayTextRef.current) {
        overlayTextTl
          .to(overlayTextRef.current, {
            y: "0rem",
            duration: 0.75,
            ease: "hop",
          })
          .to(overlayTextRef.current, {
            y: "-2rem",
            duration: 0.75,
            ease: "hop",
            delay: 0.75,
          })
          .to(overlayTextRef.current, {
            y: "-4rem",
            duration: 0.75,
            ease: "hop",
            delay: 0.75,
          })
          .to(overlayTextRef.current, {
            y: "-6rem",
            duration: 0.75,
            ease: "hop",
            delay: 1,
          });
      }

      revealTl
        .to(imgs, {
          y: 0,
          opacity: 1,
          stagger: 0.05,
          duration: 1,
          ease: "hop",
        })
        .to(imagesWrapRef.current, {
          gap: "0.75vw",
          duration: 1,
          delay: 0.5,
          ease: "hop",
        })
        .to(
          imgs,
          {
            scale: 1,
            duration: 1,
            ease: "hop",
          },
          "<"
        )
        .to(sideImgs, {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
          duration: 1,
          stagger: 0.1,
          ease: "hop",
        })
        .to(centerImg, {
          scale: 2,
          duration: 1,
          ease: "hop",
        })
        .to(overlayRef.current, {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
          duration: 1,
          ease: "hop",
        })
        .add("titleReveal", "-=0.5")
        .call(() => {
          document.body.classList.remove("hero-reveal-lock-ui");
        }, undefined, "titleReveal")
        .to(
          split.words,
          {
            yPercent: 0,
            duration: 0.75,
            stagger: 0.1,
            ease: "power3.out",
          },
          "titleReveal"
        );
    }, rootRef);

    return () => {
      document.body.classList.remove("hero-reveal-lock-ui");
      ctx.revert();
    };
  }, []);

  return (
    <section ref={rootRef} className={styles.hero}>
      <div ref={overlayRef} className={styles.heroOverlay}>
        <div className={styles.counter}>
          <h1 ref={counterRef}>0</h1>
        </div>

        <div className={styles.overlayTextContainer}>
          <div ref={overlayTextRef} className={styles.overlayText}>
            <p>Fortis</p>
            <p>Niche Atelier</p>
            <p>Welcome</p>
          </div>
        </div>
      </div>

      <div ref={imagesWrapRef} className={styles.heroImages}>
        {HERO_IMAGES.map((src, idx) => (
          <div
            key={`${src}-${idx}`}
            ref={(el) => {
              if (el) imageRefs.current[idx] = el;
            }}
            className={styles.img}
          >
            <img src={src} alt="" />
          </div>
        ))}
      </div>

      <div className={styles.heroHeader}>
        <h1 ref={heroTitleRef}>Fortis</h1>
      </div>
    </section>
  );
}
