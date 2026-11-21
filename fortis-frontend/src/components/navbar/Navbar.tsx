"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CartButton } from "@/components/cart/CartButton";
import { MenuPanel } from "./MenuPanel";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    menuToggleRef.current?.focus();
  };

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

  return (
    <>
      <nav className="site-header fixed top-0 left-0 right-0 z-50" aria-label="Glavna navigacija">
        <div className="navbar-container">
          <Link href="/" className="navbar-logo">
            FORTIS
          </Link>
          <div className="navbar-menu-right">
            <CartButton />
            <button
              ref={menuToggleRef}
              type="button"
              className="cg-menu-toggle"
              aria-expanded={isMenuOpen}
              aria-controls="cg-menu"
              onClick={toggleMenu}
            >
              {isMenuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
        <MenuPanel isOpen={isMenuOpen} onClose={closeMenu} />
      </nav>
    </>
  );
}
