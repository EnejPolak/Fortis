"use client";

import { useEffect, useRef } from "react";

const SCROLL_KEYS = [
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  "Space",
] as const;

/**
 * Locks body scroll (wheel, touch, keyboard) when isLocked is true.
 * Uses position:fixed + top offset for iOS Safari to prevent rubber-band and layout jump.
 * Restores scroll position when unlocking. Cleans up on unmount.
 */
export function useScrollLock(isLocked: boolean) {
  const savedScrollYRef = useRef(0);
  const preventScrollRef = useRef<(e: Event) => void | null>(null);
  const blockKeysRef = useRef<(e: KeyboardEvent) => void | null>(null);

  useEffect(() => {
    if (!isLocked) return;

    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    savedScrollYRef.current = scrollY;

    // 1) Overflow lock (desktop + mobile)
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // 2) iOS position lock to avoid rubber-band and preserve scroll position
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    const preventScroll = (e: Event) => e.preventDefault();
    preventScrollRef.current = preventScroll;

    const blockKeys = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.includes(e.code as (typeof SCROLL_KEYS)[number])) {
        e.preventDefault();
      }
    };
    blockKeysRef.current = blockKeys;

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("keydown", blockKeys, { passive: false });

    return () => {
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", blockKeys);
      preventScrollRef.current = null;
      blockKeysRef.current = null;

      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";

      const y = savedScrollYRef.current;
      if (typeof window !== "undefined" && y !== undefined) {
        window.scrollTo(0, y);
      }
    };
  }, [isLocked]);
}
