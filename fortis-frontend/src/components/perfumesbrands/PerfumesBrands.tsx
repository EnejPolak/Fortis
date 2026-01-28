"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { setupCardAnimations } from "./cardAnimations";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import TrailContainer from "./TrailContainer";

export function PerfumesBrands() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const lenis = setupCardAnimations();
      lenisRef.current = lenis;
    }, 100);
    
    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      if (typeof window !== "undefined") {
        (window as any).__fortisLenis = null;
      }
    };
  }, []);

  return (
    <>
      <section className="intro">
        <h1>Brendi, s katerimi sodelujemo</h1>
        <TrailContainer />
      </section>
      
      <section className="cards">
        <div className="card">
              <div className="card-marquee">
                <div className="marquee">
                  <h1>Elegance</h1>
                  <h1>Sophistication</h1>
                  <h1>Timeless</h1>
                  <h1>Authentic</h1>
                </div>
              </div>
          <div className="card-wrapper">
            <div className="card-content">
              <div className="card-title">
                <h1>Kinetic Parfumes Barcelona</h1>
              </div>
              <div className="card-description">
                <p>
                  Sodobna parfumerija z izrazitim značajem.
                </p>
              </div>
            </div>
            <div className="card-img">
              <Image
                src="/kinetic.jpg"
                alt="Perfume Brand"
                width={1920}
                height={1080}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-wrapper">
            <div className="card-content">
              <div className="card-title">
                <h1>HEADSPACE</h1>
              </div>
              <div className="card-description">
                <p>
                  Čista prisotnost. Čist prostor.
                </p>
              </div>
            </div>
            <div className="card-img">
              <Image
                src="/headspace.png"
                alt="Headspace Perfume Brand"
                width={1920}
                height={1080}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-wrapper">
            <div className="card-content">
              <div className="card-title">
                <h1>Meo Fusciuni</h1>
              </div>
              <div className="card-description">
                <p>
                  Umetnost v steklenički. Tišina, ki govori.
                </p>
              </div>
            </div>
            <div className="card-img">
              <Image
                src="/fuscini.png"
                alt="Meo Fusciuni Perfume Brand"
                width={1920}
                height={1080}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-wrapper">
            <div className="card-content">
              <div className="card-title">
                <h1>Baruti</h1>
              </div>
              <div className="card-description">
                <p>
                  Za tiste, ki ne iščejo varnega, ampak resničnega.
                </p>
              </div>
            </div>
            <div className="card-img">
              <Image
                src="/baruti.png"
                alt="Baruti Perfume Brand"
                width={1920}
                height={1080}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="outro">
        <h1>Preglej vse naše brende</h1>
        <Link href="/kolekcija" className="kolekcija-label">
          <div className="kolekcija-line"></div>
          <div className="kolekcija-text">
            <span>K</span>
            <span>o</span>
            <span>l</span>
            <span>e</span>
            <span>k</span>
            <span>c</span>
            <span>i</span>
            <span>j</span>
            <span>a</span>
          </div>
        </Link>
      </section>
    </>
  );
}
