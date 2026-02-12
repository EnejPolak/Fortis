"use client";
import React, { useEffect, useRef } from "react";
import "./contact.css";

import { gsap } from "gsap";
import { ReactLenis } from "@studio-freight/react-lenis";
import { Footer } from "@/components/footer/Footer";

const Page = () => {
  const container = useRef();
  const headerRef = useRef();
  const sectionsRef = useRef([]);
  const ctxRef = useRef(null);

  useEffect(() => {
    ctxRef.current = gsap.context(() => {
      gsap.to(headerRef.current, {
        y: 0,
        duration: 0.95,
        ease: "power3.out",
      });

      sectionsRef.current.forEach((section) => {
        if (section) {
          gsap.to(section.querySelectorAll("p"), {
            y: 0,
            duration: 0.95,
            delay: 0.08,
            stagger: 0.08,
            ease: "power3.out",
          });
        }
      });
    }, container.current);

    return () => {
      if (ctxRef.current) ctxRef.current.revert();
    };
  }, []);

  return (
    <>
      <ReactLenis root>
        <div
          className="contact-page contact-page--visible"
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
                  <p>+386 40 168 863</p>
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

