import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <Link href="/" className="footer-logo">
          FORTIS
        </Link>
        <Link href="/privacy-policy" className="footer-link">
          Privacy and Policy
        </Link>
        <Link href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="footer-link">
          Instagram
        </Link>
        <Link href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" className="footer-link">
          TikTok
        </Link>
        <div className="footer-link"></div>
      </div>
    </footer>
  );
}
