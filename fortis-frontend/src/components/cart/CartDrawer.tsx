"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { useCart } from "@/components/cart/CartProvider";
import { useScrollLock } from "@/hooks/useScrollLock";
import { formatEurFromCents } from "@/lib/commerce/money";

function formatItemCount(count: number): string {
  if (count > 99) return "99+";
  return String(count).padStart(2, "0");
}

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
        <header className="cart-drawer-header">
          <div className="cart-drawer-heading">
            <p className="cart-drawer-eyebrow">Vaš izbor</p>
            <div className="cart-drawer-title-row">
              <h2 id={titleId} className="cart-drawer-title">
                Košarica
              </h2>
              {itemCount > 0 ? (
                <span className="cart-drawer-count" aria-hidden="true">
                  {formatItemCount(itemCount)}
                </span>
              ) : null}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="cart-drawer-close"
            onClick={closeCart}
            aria-label="Zapri košarico"
          >
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <div className="cart-drawer-body">
          {lines.length === 0 ? (
            <div className="cart-empty">
              <p>Vaša košarica je prazna.</p>
              <Link
                href="/kolekcija"
                className="cart-empty-link"
                onClick={closeCart}
              >
                Raziščite kolekcijo
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
                  <div className="cart-line-main">
                    <div className="cart-line-top">
                      <div className="cart-line-copy">
                        <p className="cart-line-brand">{line.brand}</p>
                        <p className="cart-line-name">{line.name}</p>
                        <p className="cart-line-meta">{line.volumeLabel}</p>
                        {!line.available ? (
                          <p className="cart-line-error">Ni na zalogi</p>
                        ) : null}
                      </div>
                      <p className="cart-line-total">
                        {formatEurFromCents(line.lineCents)}
                      </p>
                    </div>
                    <div className="cart-line-controls">
                      <QuantityStepper
                        className="qty-stepper--drawer"
                        value={line.quantity}
                        min={1}
                        max={Math.max(1, line.maxQuantity)}
                        disabled={!line.available}
                        onChange={(qty) => updateQuantity(line.variantId, qty)}
                        aria-label={`Količina za ${line.name}`}
                      />
                      <button
                        type="button"
                        className="cart-line-remove"
                        onClick={() => removeItem(line.variantId)}
                        aria-label={`Odstrani ${line.name}`}
                      >
                        <X size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 ? (
          <footer className="cart-drawer-footer">
            <div className="cart-subtotal">
              <span>Skupna vsota</span>
              <strong>{formatEurFromCents(subtotalCents)}</strong>
            </div>
            <p className="cart-shipping-note">Dostava še ni vključena.</p>
            <Link
              href="/checkout"
              className="cart-checkout-btn btn-commerce-primary"
              onClick={closeCart}
            >
              <span>Na blagajno</span>
              <span className="cart-checkout-arrow" aria-hidden="true">
                →
              </span>
            </Link>
            <button
              type="button"
              className="cart-continue-btn"
              onClick={closeCart}
            >
              Nadaljuj z ogledom
            </button>
          </footer>
        ) : null}

        <div className="sr-only" aria-live="polite">
          {announce}
        </div>
      </div>
    </>
  );
}
