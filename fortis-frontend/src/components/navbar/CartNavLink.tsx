"use client";

import Link from "next/link";
import { useCart } from "@/context/CartProvider";

export function CartNavLink() {
  const { count } = useCart();

  if (count === 0) return null;

  return (
    <Link
      href="/kosarica"
      className="navbar-cart-link"
      aria-label={`Košarica, ${count} izdelkov`}
    >
      Košarica ({count})
    </Link>
  );
}
