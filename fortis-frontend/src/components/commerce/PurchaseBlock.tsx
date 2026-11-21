"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { useCart } from "@/components/cart/CartProvider";
import { getSellableProduct } from "@/lib/commerce/catalog";
import { formatEurFromCents } from "@/lib/commerce/money";
import { CART_MAX_LINE_QTY } from "@/lib/cart/types";

type PurchaseBlockProps = {
  slug: string;
};

export function PurchaseBlock({ slug }: PurchaseBlockProps) {
  const product = getSellableProduct(slug);
  const { addItem, openCart, stockByVariant } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState(
    () => product?.variants[0]?.id ?? ""
  );
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const qtyId = useId();
  const variantGroupId = useId();

  useEffect(() => {
    const next = getSellableProduct(slug);
    setSelectedVariantId(next?.variants[0]?.id ?? "");
    setQuantity(1);
    setStatus("idle");
    setMessage(null);
  }, [slug]);

  if (!product || !product.isSellable) {
    return (
      <div className="purchase-block purchase-block--unavailable">
        <p className="purchase-block-note">Nakup spletu trenutno ni na voljo.</p>
      </div>
    );
  }

  const variant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants[0];
  const multi = product.variants.length > 1;
  const stock = stockByVariant[variant.id];
  const max =
    stock == null
      ? CART_MAX_LINE_QTY
      : Math.max(0, Math.min(CART_MAX_LINE_QTY, stock));
  const unavailable = max <= 0;
  const qtyValue = Math.min(quantity, Math.max(1, max || 1));

  const onAdd = () => {
    if (pending || unavailable) return;
    setStatus("idle");
    setMessage(null);
    startTransition(() => {
      const result = addItem(variant.id, qtyValue);
      if (result.error) {
        setStatus("error");
        setMessage(result.error);
        return;
      }
      setStatus("success");
      setMessage("Dodano v košarico.");
      openCart();
    });
  };

  return (
    <div className="purchase-block">
      <div className="purchase-summary">
        {multi ? (
          <fieldset className="purchase-variants">
            <legend className="sr-only">Prostornina</legend>
            <div
              className="purchase-variant-list"
              role="radiogroup"
              aria-label="Prostornina"
            >
              {product.variants.map((v) => {
                const vStock = stockByVariant[v.id];
                const vMax =
                  vStock == null
                    ? CART_MAX_LINE_QTY
                    : Math.max(0, Math.min(CART_MAX_LINE_QTY, vStock));
                const soldOut = vMax <= 0;
                const selected = v.id === variant.id;
                return (
                  <label
                    key={v.id}
                    className={`purchase-variant${selected ? " purchase-variant--selected" : ""}${soldOut ? " purchase-variant--unavailable" : ""}`}
                  >
                    <input
                      type="radio"
                      name={variantGroupId}
                      value={v.id}
                      checked={selected}
                      disabled={soldOut}
                      onChange={() => {
                        setSelectedVariantId(v.id);
                        setQuantity(1);
                        setStatus("idle");
                        setMessage(null);
                      }}
                    />
                    <span>{v.volumeLabel}</span>
                    {soldOut ? (
                      <span className="purchase-variant-badge">Ni na zalogi</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <p className="purchase-summary-volume">{variant.volumeLabel}</p>
        )}
        <p className="parfum-price parfum-price--detail purchase-price" aria-live="polite">
          {unavailable ? "Ni na zalogi" : formatEurFromCents(variant.unitCents)}
        </p>
      </div>

      <div className="purchase-actions">
        <div className="purchase-qty">
          <label htmlFor={qtyId} className="sr-only">
            Količina
          </label>
          <QuantityStepper
            id={qtyId}
            className="qty-stepper--purchase"
            value={qtyValue}
            max={Math.max(1, max)}
            disabled={unavailable || pending}
            onChange={(next) => {
              setQuantity(next);
              setStatus("idle");
              setMessage(null);
            }}
          />
        </div>
        <button
          type="button"
          className="purchase-add"
          disabled={unavailable || pending}
          aria-busy={pending}
          onClick={onAdd}
        >
          <span className="purchase-add-label">
            {pending ? "Dodajam…" : unavailable ? "Ni na zalogi" : "Dodaj v košarico"}
          </span>
        </button>
      </div>

      <div className="purchase-feedback">
        {status === "error" && message ? (
          <p className="purchase-feedback-msg purchase-feedback-msg--error" role="alert">
            {message}
          </p>
        ) : null}
        <div className="sr-only" aria-live="polite">
          {status === "success" ? message : ""}
        </div>
      </div>
    </div>
  );
}
