"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatEurFromCents } from "@/lib/commerce/money";

type OrderPayload = {
  order: {
    order_number: string;
    full_name: string;
    email: string;
    fulfillment: string;
    shipping_address: {
      line1?: string;
      line2?: string;
      city?: string;
      postalCode?: string;
      country?: string;
    } | null;
    subtotal_cents: number;
    shipping_cents: number;
    total_cents: number;
    payment_status: string;
    fulfillment_status: string;
  };
  items: Array<{
    product_name: string;
    brand: string;
    volume_label: string;
    quantity: number;
    line_cents: number;
  }>;
};

export function OrderConfirmation({
  orderNumber,
  token,
}: {
  orderNumber: string;
  token?: string;
}) {
  const { clearCart } = useCart();
  const [data, setData] = useState<OrderPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function load() {
      attempts += 1;
      const qs = new URLSearchParams({ order: orderNumber });
      if (token) qs.set("token", token);
      try {
        const res = await fetch(`/api/orders/status?${qs.toString()}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setError(json.error ?? "Naročila ni mogoče prikazati.");
            setLoading(false);
          }
          return;
        }
        if (!cancelled) {
          setData(json);
          setLoading(false);
          if (json.order?.payment_status === "paid") {
            clearCart();
            window.sessionStorage.removeItem("fortis.pendingOrder");
          } else if (
            json.order?.payment_status === "pending" &&
            attempts < 8
          ) {
            // Webhook may lag briefly after redirect
            window.setTimeout(load, 1500);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Omrežna napaka.");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderNumber, token, clearCart]);

  if (loading) {
    return <p className="shop-lead">Preverjam naročilo…</p>;
  }

  if (error || !data) {
    return (
      <div>
        <p className="shop-banner shop-banner--error">{error ?? "Napaka."}</p>
        <Link href="/kolekcija" className="shop-secondary">
          Nazaj v kolekcijo
        </Link>
      </div>
    );
  }

  const { order, items } = data;
  const paid = order.payment_status === "paid";
  const pending = order.payment_status === "pending";

  return (
    <div className="shop-grid shop-grid--checkout">
      <div>
        <div
          className={`shop-banner${paid ? " shop-banner--ok" : pending ? "" : " shop-banner--error"}`}
          role="status"
        >
          {paid
            ? "Naročilo je uspešno plačano."
            : pending
              ? "Plačilo še ni potrjeno. Osvežite stran čez trenutek ali preverite e-pošto."
              : `Status plačila: ${order.payment_status}.`}
        </div>

        <p className="shop-lead">
          Številka naročila: <strong>{order.order_number}</strong>
        </p>

        <section className="shop-section">
          <h2 className="shop-section-title">Kaj sledi</h2>
          <p className="shop-lead" style={{ marginBottom: 0 }}>
            {order.fulfillment === "pickup"
              ? "Ko bo naročilo pripravljeno, vas obvestimo o prevzemu v ateljeju (Poljanska cesta 7, Ljubljana)."
              : "Naročilo bomo odpremili po potrditvi plačila."}
          </p>
          <p className="purchase-feedback-msg purchase-feedback-msg--muted">
            Potrditveno e-pošto pošljemo, ko je e-poštna storitev konfigurirana.
            Trenutno shranite številko naročila.
          </p>
        </section>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/kolekcija" className="shop-primary" style={{ textDecoration: "none" }}>
            Nadaljuj z ogledom
          </Link>
          <Link href="/racun/narocila" className="shop-secondary">
            Moja naročila
          </Link>
        </div>
      </div>

      <aside className="shop-summary">
        <h2 className="shop-summary-title">Povzetek</h2>
        {items.map((item, idx) => (
          <div key={`${item.brand}-${item.product_name}-${idx}`} className="shop-summary-line">
            <span>
              {item.brand} — {item.product_name}
              <br />
              {item.volume_label} × {item.quantity}
            </span>
            <span>{formatEurFromCents(item.line_cents)}</span>
          </div>
        ))}
        <div className="shop-summary-line">
          <span>Vmesna vsota</span>
          <span>{formatEurFromCents(order.subtotal_cents)}</span>
        </div>
        <div className="shop-summary-line">
          <span>{order.fulfillment === "pickup" ? "Prevzem" : "Dostava"}</span>
          <span>{formatEurFromCents(order.shipping_cents)}</span>
        </div>
        <div className="shop-summary-total">
          <span>Skupaj</span>
          <span>{formatEurFromCents(order.total_cents)}</span>
        </div>
        {order.shipping_address ? (
          <p className="purchase-feedback-msg purchase-feedback-msg--muted">
            {order.shipping_address.line1}
            {order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ""}
            <br />
            {order.shipping_address.postalCode} {order.shipping_address.city}
          </p>
        ) : (
          <p className="purchase-feedback-msg purchase-feedback-msg--muted">
            Prevzem: {order.full_name}
          </p>
        )}
      </aside>
    </div>
  );
}
