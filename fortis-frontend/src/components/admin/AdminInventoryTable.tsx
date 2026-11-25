"use client";

import { useMemo, useState } from "react";
import { formatEurFromCents } from "@/lib/commerce/money";
import { AdminStockForm } from "@/components/admin/AdminStockForm";

export type AdminInventoryRow = {
  variantId: string;
  slug: string;
  brand: string;
  name: string;
  volumeLabel: string;
  catalogueCents: number;
  sku: string;
  unitCentsOverride: number | null;
  isActive: boolean;
  /** Free stock (product_inventory.stock_quantity) — excludes active reservations */
  available: number;
  reserved: number;
  /** available + reserved */
  physical: number;
  exists: boolean;
};

export function AdminInventoryTable({ rows }: { rows: AdminInventoryRow[] }) {
  const [q, setQ] = useState("");
  const [onlyZero, setOnlyZero] = useState(false);
  const [onlyInactive, setOnlyInactive] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (onlyZero && row.available > 0) return false;
      if (onlyInactive && row.isActive) return false;
      if (!needle) return true;
      const hay = [
        row.brand,
        row.name,
        row.slug,
        row.variantId,
        row.sku,
        row.volumeLabel,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q, onlyZero, onlyInactive]);

  return (
    <div>
      <div className="admin-inventory-toolbar">
        <label className="shop-label admin-search-label">
          Iskanje
          <input
            className="shop-input"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Parfum, znamka, SKU, variant…"
            autoComplete="off"
          />
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={onlyZero}
            onChange={(e) => setOnlyZero(e.target.checked)}
          />
          Samo razpoložljivo = 0
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={onlyInactive}
            onChange={(e) => setOnlyInactive(e.target.checked)}
          />
          Samo neaktivni
        </label>
        <p className="admin-muted">
          Prikaži {filtered.length} / {rows.length}
        </p>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Izdelek</th>
              <th>Cena</th>
              <th>Fizično</th>
              <th>Rezervirano</th>
              <th>Na voljo</th>
              <th>Uredi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.variantId}>
                <td>
                  <strong>
                    {row.brand} — {row.name}
                  </strong>
                  <br />
                  <span className="admin-muted">
                    {row.volumeLabel} · {row.variantId}
                    {row.sku ? ` · SKU ${row.sku}` : ""}
                    {!row.isActive ? " · neaktiven" : ""}
                    {!row.exists ? " · ni vpisano" : ""}
                  </span>
                </td>
                <td>
                  {formatEurFromCents(row.catalogueCents)}
                  {row.unitCentsOverride != null
                    ? ` → ${formatEurFromCents(row.unitCentsOverride)}`
                    : ""}
                </td>
                <td>{row.exists ? row.physical : "—"}</td>
                <td>{row.exists ? row.reserved : "—"}</td>
                <td>{row.exists ? row.available : "—"}</td>
                <td>
                  <AdminStockForm
                    variantId={row.variantId}
                    slug={row.slug}
                    catalogueCents={row.catalogueCents}
                    initialStock={row.available}
                    initialActive={row.isActive}
                    initialSku={row.sku}
                    initialOverrideCents={row.unitCentsOverride}
                    exists={row.exists}
                    reserved={row.reserved}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
