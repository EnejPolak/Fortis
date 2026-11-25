"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "unfulfilled", label: "Neizpolnjeno" },
  { value: "ready", label: "Pripravljeno za prevzem" },
  { value: "shipped", label: "Odposlano" },
  { value: "delivered", label: "Zaključeno" },
  { value: "cancelled", label: "Preklicano" },
] as const;

export function AdminFulfillmentForm({
  orderNumber,
  currentStatus,
  fulfillment,
  trackingUrl: initialTracking,
}: {
  orderNumber: string;
  currentStatus: string;
  fulfillment: string;
  trackingUrl: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [trackingUrl, setTrackingUrl] = useState(initialTracking);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setMsg(null);

    try {
      const res = await fetch("/api/admin/orders/fulfillment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, status, trackingUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error ?? "Posodobitev ni uspela.");
        setPending(false);
        return;
      }
      setMsg("Shranjeno.");
      router.refresh();
    } catch {
      setMsg("Omrežna napaka.");
    }
    setPending(false);
  }

  return (
    <form className="admin-fulfillment-form" onSubmit={onSubmit}>
      <h2 className="shop-section-title">Status izpolnitve</h2>
      <label className="shop-label">
        Status
        <select
          className="shop-input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {fulfillment === "delivery" || status === "shipped" ? (
        <label className="shop-label">
          Sledilna povezava
          <input
            className="shop-input"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
          />
        </label>
      ) : null}
      <button type="submit" className="shop-primary" disabled={pending}>
        {pending ? "Shranjujem…" : "Posodobi"}
      </button>
      {msg ? <p className="shop-lead">{msg}</p> : null}
    </form>
  );
}
