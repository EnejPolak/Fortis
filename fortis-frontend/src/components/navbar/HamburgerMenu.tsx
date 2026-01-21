"use client";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClick: () => void;
}

export function HamburgerMenu({ isOpen, onClick }: HamburgerMenuProps) {
  return (
    <button
      className="hamburger-menu text-white flex flex-col gap-1.5 w-6 h-6 justify-center items-end"
      aria-label="Menu"
      onClick={onClick}
    >
      <span className="hamburger-line hamburger-line-top"></span>
      <span className="hamburger-line hamburger-line-middle"></span>
      <span className="hamburger-line hamburger-line-bottom"></span>
    </button>
  );
}
