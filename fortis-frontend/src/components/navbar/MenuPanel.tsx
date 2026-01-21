"use client";

import { useEffect } from "react";
import { HamburgerMenu } from "./HamburgerMenu";

interface MenuPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function MenuPanel({ isOpen, onToggle, onClose }: MenuPanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="menu-panel-backdrop fixed inset-0 z-40"
          onClick={onClose}
        />
      )}
      <div className="menu-panel-container absolute top-0 right-0 z-50">
        <div className="relative" style={{ width: "24px", height: "24px" }}>
          <div className="absolute top-0 right-0" style={{ width: "24px", height: "24px", zIndex: 10 }}>
            <HamburgerMenu isOpen={isOpen} onClick={onToggle} />
          </div>
          <div className={`menu-panel ${isOpen ? "menu-panel-open" : "menu-panel-closed"}`}>
            {isOpen && (
              <div className="flex items-start justify-between">
                <nav className="flex flex-col gap-4">
                  <a href="#" className="text-white hover:text-gray-300 transition-colors text-sm">
                    About
                  </a>
                  <a href="#" className="text-white hover:text-gray-300 transition-colors text-sm">
                    Collections
                  </a>
                  <a href="#" className="text-white hover:text-gray-300 transition-colors text-sm">
                    Contact
                  </a>
                </nav>
                <div className="flex-shrink-0 ml-6" style={{ width: "24px", height: "24px" }}>
                  {/* Spacer for hamburger position */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
