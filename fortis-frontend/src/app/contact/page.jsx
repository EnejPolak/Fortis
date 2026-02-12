"use client";
import React, { useEffect, useRef, useState } from "react";
import "./contact.css";

import { gsap } from "gsap";
import { ReactLenis } from "@studio-freight/react-lenis";
import { Footer } from "@/components/footer/Footer";

const Page = () => {
  const container = useRef();
  const headerRef = useRef();
  const sectionsRef = useRef([]);
  const ctxRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const MENU_CLOSE_DURATION = 2.5;
    const delayedCall = gsap.delayedCall(MENU_CLOSE_DURATION, () => {
      setIsVisible(true);
      ctxRef.current = gsap.context(() => {
        gsap.to(headerRef.current, {
          y: 0,
          duration: 1,
          delay: 0.3,
          ease: "power3.out",
        });

        gsap.delayedCall(0.4, () => {
          sectionsRef.current.forEach((section) => {
            if (section) {
              gsap.to(section.querySelectorAll("p"), {
                y: 0,
                duration: 1,
                stagger: 0.1,
                ease: "power3.out",
              });
            }
          });
        });
      }, container.current);
    });

    return () => {
      delayedCall.kill();
      if (ctxRef.current) ctxRef.current.revert();
    };
  }, []);

  return (
    <>
    <ReactLenis root>
      <div
        className={`contact-page${isVisible ? " contact-page--visible" : ""}`}
        ref={container}
      >
        <div className="container">
          <div className="col">
            <div className="where" ref={(el) => (sectionsRef.current[0] = el)}>
              <div className="title">
                <p>Lokacija</p>
              </div>
              <div className="item">
                <p>Poljanska cesta 1</p>
              </div>
              <div className="item">
                <p>1000 Ljubljana</p>
              </div>
              <div className="item">
                <p>Slovenija</p>
              </div>
            </div>
            <div className="vat" ref={(el) => (sectionsRef.current[1] = el)}>
              <div className="title">
                <p>Telefon</p>
              </div>
              <div className="item">
                <p>+386 70 168 863</p>
              </div>
            </div>
          </div>

          <div className="col">
            <div className="contact-header">
              <h1 ref={headerRef}>Kontakt</h1>
            </div>
            <div
              className="socials"
              ref={(el) => (sectionsRef.current[2] = el)}
            >
              <div className="title">
                <p>Socials</p>
              </div>
              <div className="item">
                <p>
                  <a href="https://www.instagram.com/fortisnicheatelier/">Instagram</a>
                </p>
              </div>
              <div className="item">
                <p>
                  <a href="https://www.tiktok.com/@fortis.niche.atelier">TikTok</a>
                </p>
              </div>
            </div>
            <div className="mail" ref={(el) => (sectionsRef.current[3] = el)}>
              <div className="title">
                <p>Mail</p>
              </div>
              <div className="item">
                <p>
                  <a href="#">fortisnicheatelier@gmail.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReactLenis>
    <Footer />
    </>
  );
};

export default Page;

