"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminStockForm({
  variantId,
  slug,
  catalogueCents,
  initialStock,
  initialActive,
  initialSku,
  initialOverrideCents,
  exists,
  reserved = 0,
}: {
  variantId: string;
  slug: string;
  catalogueCents: number;
  /** Available (free) stock — not including active reservations */
  initialStock: number;
  initialActive: boolean;
  initialSku: string;
  initialOverrideCents: number | null;
  exists: boolean;
  reserved?: number;
}) {
  const router = useRouter();
  const [stock, setStock] = useState(String(initialStock));
  const [active, setActive] = useState(initialActive);
  const [sku, setSku] = useState(initialSku);
  const [overrideEur, setOverrideEur] = useState(
    initialOverrideCents != null ? (initialOverrideCents / 100).toFixed(2) : ""
  );
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setMsg(null);

    const stockQty = Number.parseInt(stock, 10);
    if (!Number.isInteger(stockQty) || stockQty < 0) {
      setMsg("Količina mora biti nenegativno celo število.");
      setPending(false);
      return;
    }

    const override =
      overrideEur.trim() === ""
        ? null
        : Math.round(Number.parseFloat(overrideEur.replace(",", ".")) * 100);

    if (overrideEur.trim() !== "" && (override == null || !Number.isFinite(override) || override < 0)) {
      setMsg("Cena ni veljavna.");
      setPending(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          slug,
          stockQuantity: stockQty,
          isActive: active,
          sku: sku.trim() || null,
          unitCents: Number.isFinite(override as number) ? override : null,
          catalogueCents,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error ?? "Shranjevanje ni uspelo.");
        setPending(false);
        return;
      }
      setMsg(exists ? "Posodobljeno." : "Ustvarjeno.");
      router.refresh();
    } catch {
      setMsg("Omrežna napaka.");
    }
    setPending(false);
  }

  return (
    <form className="admin-inline-form" onSubmit={onSubmit}>
      <label>
        Na voljo (brez rezervacij)
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
        />
      </label>
      {reserved > 0 ? (
        <span className="admin-muted">
          Aktivne rezervacije: {reserved} (ostanejo nespremenjene)
        </span>
      ) : null}
      <label>
        SKU
        <input value={sku} onChange={(e) => setSku(e.target.value)} />
      </label>
      <label>
        Cena € (prazno = katalog)
        <input
          value={overrideEur}
          onChange={(e) => setOverrideEur(e.target.value)}
          placeholder={(catalogueCents / 100).toFixed(2)}
        />
      </label>
      <label className="admin-check">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Aktiven
      </label>
      <button type="submit" className="shop-secondary" disabled={pending}>
        {pending ? "…" : "Shrani"}
      </button>
      {msg ? <span className="admin-muted">{msg}</span> : null}
    </form>
  );
}
