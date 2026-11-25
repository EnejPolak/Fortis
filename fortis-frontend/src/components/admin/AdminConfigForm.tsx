"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type FulfillmentConfig = {
  delivery?: {
    enabled?: boolean;
    cents?: number | null;
  };
};

export function AdminConfigForm({ initial }: { initial: unknown }) {
  const router = useRouter();
  const cfg = (initial ?? {}) as FulfillmentConfig;
  const [enabled, setEnabled] = useState(Boolean(cfg.delivery?.enabled));
  const [cents, setCents] = useState(
    cfg.delivery?.cents != null ? String(cfg.delivery.cents) : ""
  );
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setMsg(null);

    const deliveryCents =
      cents.trim() === "" ? null : Number.parseInt(cents, 10);

    if (enabled && (deliveryCents == null || deliveryCents < 0)) {
      setMsg("Za omogočeno dostavo vnesite veljavno ceno v centih.");
      setPending(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryEnabled: enabled,
          deliveryCents,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error ?? "Shranjevanje ni uspelo.");
        setPending(false);
        return;
      }
      setMsg(
        "Shranjeno v store_config. Za javni checkout še vedno velja tudi NEXT_PUBLIC_DELIVERY_CENTS, če je nastavljen."
      );
      router.refresh();
    } catch {
      setMsg("Omrežna napaka.");
    }
    setPending(false);
  }

  return (
    <form className="admin-fulfillment-form" onSubmit={onSubmit}>
      <label className="admin-check">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Omogoči dostavo v store_config
      </label>
      <label className="shop-label">
        Cena dostave (centi EUR)
        <input
          className="shop-input"
          value={cents}
          onChange={(e) => setCents(e.target.value)}
          placeholder="npr. 590"
        />
      </label>
      <button type="submit" className="shop-secondary" disabled={pending}>
        Shrani
      </button>
      {msg ? <p className="shop-lead">{msg}</p> : null}
    </form>
  );
}
