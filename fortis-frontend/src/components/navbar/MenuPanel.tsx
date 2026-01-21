"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface MenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MenuPanel({ isOpen, onClose }: MenuPanelProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const lenis = typeof window !== "undefined" ? (window as any).__fortisLenis : null;
    const preventScroll = (event: Event) => {
      event.preventDefault();
    };

    const preventKeys = (event: KeyboardEvent) => {
      const blockedKeys = [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        "Space",
      ];
      if (blockedKeys.includes(event.code)) {
        event.preventDefault();
      }
    };

    if (isOpen) {
      if (lenis && typeof lenis.stop === "function") {
        lenis.stop();
      }
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
      window.addEventListener("keydown", preventKeys, { passive: false });
    }

    return () => {
      if (lenis && typeof lenis.start === "function") {
        lenis.start();
      }
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventKeys);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!menuRef.current) return;
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ paused: true });
      if (backdropRef.current) {
        gsap.set(backdropRef.current, { opacity: 0, pointerEvents: "none" });
        timeline.set(backdropRef.current, { pointerEvents: "auto" }, 0);
        timeline.to(
          backdropRef.current,
          {
            duration: 0.25,
            opacity: 1,
            ease: "power2.out",
          },
          0
        );
      }
      timeline.to(
        ".cg-menu-row",
        {
          duration: 1.9,
          left: "0%",
          ease: "power4.out",
          stagger: 0.12,
        },
        0
      );
      timelineRef.current = timeline;
    }, menuRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!timelineRef.current) return;
    if (isOpen) {
      timelineRef.current.play();
    } else {
      timelineRef.current.reverse();
    }
  }, [isOpen]);

  return (
    <>
      <div
        ref={backdropRef}
        className="cg-menu-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        id="cg-menu"
        ref={menuRef}
        className={`cg-menu ${isOpen ? "cg-menu-open" : "cg-menu-closed"}`}
      >
        <div className="cg-menu-inner">
          <div className="cg-menu-row cg-row-1">
            <div className="cg-menu-link">
              <a href="#">Realities</a>
            </div>
          </div>
          <div className="cg-menu-row cg-row-2">
            <div className="cg-menu-link">
              <a href="#">Artists</a>
            </div>
          </div>
          <div className="cg-menu-row cg-row-3">
            <div className="cg-menu-link">
              <a href="#">Film</a>
            </div>
          </div>
          <div className="cg-menu-row cg-row-4">
            <div className="cg-menu-link">
              <a href="#">Over Ones</a>
            </div>
            <div className="cg-menu-link">
              <a href="#">Publications</a>
            </div>
          </div>
          <div className="cg-menu-row cg-row-5">
            <div className="cg-menu-link">
              <a href="#">Team</a>
            </div>
            <div className="cg-menu-link">
              <a href="#">Inspirations</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
