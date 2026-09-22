"use client";

import { PARTNER_LOGOS } from "@/data/partners";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const SCROLL_SPEED_PX = 26;
const NUDGE_DURATION_MS = 420;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function OurPartners() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const setWidthRef = useRef(0);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const animatingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);

  const loopLogos = [...PARTNER_LOGOS, ...PARTNER_LOGOS];

  const measureSetWidth = useCallback(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track) return;
    setWidthRef.current = track.scrollWidth / 2;
    if (viewport) {
      const count = getVisibleCount(viewport.clientWidth);
      viewport.style.setProperty("--partner-slide-width", `${viewport.clientWidth / count}px`);
    }
  }, []);

  const applyTransform = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
    const w = setWidthRef.current;
    if (w > 0) {
      setProgress((offsetRef.current % w) / w);
    }
  }, []);

  const normalizeOffset = useCallback(() => {
    const w = setWidthRef.current;
    if (w <= 0) return;
    while (offsetRef.current >= w) offsetRef.current -= w;
    while (offsetRef.current < 0) offsetRef.current += w;
  }, []);

  const nudge = useCallback(
    (direction: 1 | -1) => {
      const viewport = viewportRef.current;
      const w = setWidthRef.current;
      if (!viewport || w <= 0 || animatingRef.current) return;

      const slideWidth = viewport.clientWidth / getVisibleCount(viewport.clientWidth);
      const target = offsetRef.current + direction * slideWidth;
      animatingRef.current = true;
      pausedRef.current = true;
      setPaused(true);

      const start = offsetRef.current;
      const delta = direction * slideWidth;
      const startTime = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / NUDGE_DURATION_MS);
        const eased = 1 - (1 - t) ** 3;
        offsetRef.current = start + delta * eased;
        normalizeOffset();
        applyTransform();

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          animatingRef.current = false;
          pausedRef.current = false;
          setPaused(false);
        }
      };
      requestAnimationFrame(step);
    },
    [applyTransform, normalizeOffset]
  );

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    measureSetWidth();
    window.addEventListener("resize", measureSetWidth);
    return () => window.removeEventListener("resize", measureSetWidth);
  }, [measureSetWidth]);

  useEffect(() => {
    if (reducedMotion) return;

    let last = performance.now();

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      if (!pausedRef.current && !animatingRef.current && setWidthRef.current > 0) {
        offsetRef.current += (dt / 1000) * SCROLL_SPEED_PX;
        normalizeOffset();
        applyTransform();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion, applyTransform, normalizeOffset]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const onPointerDown = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    onPointerDown.current = e.touches[0]?.clientX ?? null;
    pausedRef.current = true;
    setPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = onPointerDown.current;
    const end = e.changedTouches[0]?.clientX;
    onPointerDown.current = null;
    if (start != null && end != null) {
      const diff = start - end;
      if (Math.abs(diff) > 40) nudge(diff > 0 ? 1 : -1);
    }
    pausedRef.current = false;
    setPaused(false);
  };

  return (
    <section className="partnerji-section" aria-labelledby="partnerji-heading">
      <div className="partnerji-inner">
        <div className="partnerji-heading">
          <span className="partnerji-heading-line" aria-hidden="true" />
          <h2 id="partnerji-heading" className="partnerji-title">
            Naši partnerji
          </h2>
          <span className="partnerji-heading-line" aria-hidden="true" />
        </div>

        {reducedMotion ? (
          <ul className="partnerji-static">
            {PARTNER_LOGOS.map((partner) => (
              <li key={partner.name} className="partnerji-slide">
                <div className="partnerji-logo-wrap">
                  <Image
                    src={partner.src}
                    alt={partner.name}
                    width={partner.width}
                    height={partner.height}
                    className="partnerji-logo"
                    style={{ maxHeight: partner.displayHeight }}
                    unoptimized
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="partnerji-carousel">
            <button
              type="button"
              className="partnerji-nav partnerji-nav--prev"
              aria-label="Premakni partnerje nazaj"
              onClick={() => nudge(-1)}
            >
              <span aria-hidden="true">‹</span>
            </button>

            <div
              ref={viewportRef}
              className="partnerji-viewport"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <ul ref={trackRef} className="partnerji-track">
                {loopLogos.map((partner, index) => (
                  <li
                    key={`${partner.name}-${index}`}
                    className="partnerji-slide"
                    aria-hidden={index >= PARTNER_LOGOS.length}
                  >
                    <div className="partnerji-logo-wrap">
                      <Image
                        src={partner.src}
                        alt={index < PARTNER_LOGOS.length ? partner.name : ""}
                        width={partner.width}
                        height={partner.height}
                        className="partnerji-logo"
                        style={{ maxHeight: partner.displayHeight }}
                        draggable={false}
                        unoptimized
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className="partnerji-nav partnerji-nav--next"
              aria-label="Premakni partnerje naprej"
              onClick={() => nudge(1)}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        )}

        {!reducedMotion ? (
          <div
            className="partnerji-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label="Napredovanje partnerjev"
          >
            <div className="partnerji-progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        ) : null}

        <p className="partnerji-tagline">Zaupanje, ki nas povezuje</p>
      </div>
    </section>
  );
}

function getVisibleCount(viewportWidth: number): number {
  if (viewportWidth >= 1024) return 5.5;
  if (viewportWidth >= 640) return 3.5;
  return 2;
}
