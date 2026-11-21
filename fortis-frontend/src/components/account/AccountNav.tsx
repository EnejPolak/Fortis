"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

const LINKS = [
  { href: "/racun/narocila", label: "Moja naročila" },
  { href: "/racun/osebni-podatki", label: "Osebni podatki" },
  { href: "/racun/naslovi", label: "Naslovi" },
  { href: "/racun/varnost", label: "Varnost" },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <nav className="account-nav" aria-label="Račun">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
      <button type="button" className="shop-secondary" onClick={logout}>
        Odjava
      </button>
    </nav>
  );
}
