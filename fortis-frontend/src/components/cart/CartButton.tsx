"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

function cartAriaLabel(count: number): string {
  if (count <= 0) return "Košarica";
  if (count === 1) return "Košarica, 1 izdelek";
  if (count === 2) return "Košarica, 2 izdelka";
  if (count === 3 || count === 4) return `Košarica, ${count} izdelki`;
  return `Košarica, ${count} izdelkov`;
}

function formatCartCount(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

export function CartButton() {
  const { itemCount, openCart, ready, addSuccessVersion } = useCart();
  const [wobble, setWobble] = useState(false);
  const prevSuccessRef = useRef(0);

  useEffect(() => {
    if (addSuccessVersion <= 0) return;
    if (addSuccessVersion === prevSuccessRef.current) return;
    prevSuccessRef.current = addSuccessVersion;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    setWobble(false);
    const frame = window.requestAnimationFrame(() => {
      setWobble(true);
    });
    const timer = window.setTimeout(() => setWobble(false), 450);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [addSuccessVersion]);

  const showCount = ready && itemCount > 0;

  return (
    <button
      type="button"
      className="navbar-icon-btn navbar-cart-btn"
      onClick={openCart}
      aria-label={cartAriaLabel(itemCount)}
      data-tooltip="Košarica"
    >
      <span
        className={`navbar-bag${wobble ? " navbar-bag--wobble" : ""}`}
        aria-hidden="true"
      >
        <ShoppingBag
          className="navbar-bag-svg"
          size={27}
          strokeWidth={1.5}
        />
        {showCount ? (
          <span className="navbar-bag-count">{formatCartCount(itemCount)}</span>
        ) : null}
      </span>
    </button>
  );
}
