import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <Link href="/" className="footer-logo">
          FORTIS
        </Link>
        <nav className="footer-nav">
          <Link href="/privacy-policy" className="footer-link">
            Privacy and Policy
          </Link>
          <Link href="https://www.instagram.com/fortisnicheatelier/" target="_blank" rel="noopener noreferrer" className="footer-link">
            Instagram
          </Link>
          <Link href="https://www.tiktok.com/@fortis.niche.atelier" target="_blank" rel="noopener noreferrer" className="footer-link">
            TikTok
          </Link>
        </nav>
      </div>
    </footer>
  );
}
