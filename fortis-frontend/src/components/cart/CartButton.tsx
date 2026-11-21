"use client";

import { useCart } from "@/components/cart/CartProvider";

export function CartButton() {
  const { itemCount, openCart, ready } = useCart();

  return (
    <button
      type="button"
      className="navbar-cart-btn"
      onClick={openCart}
      aria-label={
        itemCount > 0 ? `Košarica, ${itemCount} kosov` : "Košarica"
      }
    >
      <span>Košarica</span>
      {ready && itemCount > 0 ? (
        <span className="navbar-cart-count" aria-hidden="true">
          {itemCount}
        </span>
      ) : null}
    </button>
  );
}
