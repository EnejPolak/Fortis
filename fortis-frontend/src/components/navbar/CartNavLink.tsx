"use client";

import Link from "next/link";
import { useCart } from "@/context/CartProvider";

export function CartNavLink() {
  const { count } = useCart();

  return (
    <Link
      href="/kosarica"
      className="navbar-cart-link"
      aria-label={count > 0 ? `Košarica, ${count} izdelkov` : "Košarica"}
    >
      Košarica{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
