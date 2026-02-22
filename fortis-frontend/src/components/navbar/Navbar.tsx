"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuPanel } from "./MenuPanel";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const homeHref = pathname && pathname !== "/" ? "/?skipReveal=1" : "/";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="navbar-container">
          <Link
            href={homeHref}
            className="navbar-logo"
            style={{
              fontFamily: "Libre Baskerville, serif",
              fontWeight: "bold",
              textTransform: "uppercase",
              fontSize: "18px",
              letterSpacing: "0.05em",
            }}
          >
            FORTIS
          </Link>
          <div className="navbar-menu-right">
            <button
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
