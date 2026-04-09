import Link from "next/link";
import { FooterCookiesButton } from "./FooterCookiesButton";

export function Footer() {
  return (
    <footer className="footer">
      <nav className="footer-content" aria-label="Noga strani">
        <Link href="/" className="footer-logo">
          FORTIS
        </Link>
        <Link href="/privacy-policy" className="footer-link">
          Privacy and Policy
        </Link>
        <FooterCookiesButton />
        <Link href="https://www.instagram.com/fortisnicheatelier/" target="_blank" rel="noopener noreferrer" className="footer-link">
          Instagram
        </Link>
        <Link href="https://www.tiktok.com/@fortis.niche.atelier" target="_blank" rel="noopener noreferrer" className="footer-link">
          TikTok
        </Link>
      </nav>
    </footer>
  );
}
