"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { useCart } from "@/components/cart/CartProvider";
import { useScrollLock } from "@/hooks/useScrollLock";
import { formatEurFromCents } from "@/lib/commerce/money";

export function CartDrawer() {
  const {
    isOpen,
    closeCart,
    lines,
    itemCount,
    subtotalCents,
    updateQuantity,
    removeItem,
    announce,
  } = useCart();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCart();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  return (
    <>
      <div
        className={`cart-drawer-backdrop${isOpen ? " cart-drawer-backdrop--open" : ""}`}
        onClick={closeCart}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={`cart-drawer${isOpen ? " cart-drawer--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        hidden={!isOpen}
      >
        <div className="cart-drawer-header">
          <h2 id={titleId} className="cart-drawer-title">
            Košarica{itemCount > 0 ? ` (${itemCount})` : ""}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="cart-drawer-close"
            onClick={closeCart}
            aria-label="Zapri košarico"
          >
            Zapri
          </button>
        </div>

        <div className="cart-drawer-body">
          {lines.length === 0 ? (
            <div className="cart-empty">
              <p>Košarica je prazna.</p>
              <Link href="/kolekcija" className="cart-empty-link" onClick={closeCart}>
                Pojdi v kolekcijo
              </Link>
            </div>
          ) : (
            <ul className="cart-line-list">
              {lines.map((line) => (
                <li key={line.variantId} className="cart-line">
                  <div className="cart-line-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={line.imageSrc} alt="" />
                  </div>
                  <div className="cart-line-info">
                    <p className="cart-line-brand">{line.brand}</p>
                    <p className="cart-line-name">{line.name}</p>
                    <p className="cart-line-meta">
                      {line.volumeLabel} · {formatEurFromCents(line.unitCents)}
                    </p>
                    {!line.available ? (
                      <p className="cart-line-error">Ni na zalogi</p>
                    ) : null}
                    <div className="cart-line-controls">
                      <QuantityStepper
                        value={line.quantity}
                        max={Math.max(1, line.maxQuantity)}
                        disabled={!line.available}
                        onChange={(qty) => updateQuantity(line.variantId, qty)}
                        aria-label={`Količina za ${line.name}`}
                      />
                      <button
                        type="button"
                        className="cart-line-remove"
                        onClick={() => removeItem(line.variantId)}
                      >
                        Odstrani
                      </button>
                    </div>
                  </div>
                  <p className="cart-line-total">{formatEurFromCents(line.lineCents)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 ? (
          <div className="cart-drawer-footer">
            <div className="cart-subtotal">
              <span>Vmesna vsota</span>
              <strong>{formatEurFromCents(subtotalCents)}</strong>
            </div>
            <p className="cart-shipping-note">Dostava še ni vključena.</p>
            <Link
              href="/checkout"
              className="cart-checkout-btn btn-commerce-primary"
              onClick={closeCart}
            >
              Na blagajno
            </Link>
            <button type="button" className="cart-continue-btn" onClick={closeCart}>
              Nadaljuj z ogledom
            </button>
          </div>
        ) : null}

        <div className="sr-only" aria-live="polite">
          {announce}
        </div>
      </div>
    </>
  );
}
