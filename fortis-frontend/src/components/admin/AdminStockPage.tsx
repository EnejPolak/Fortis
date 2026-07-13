"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { adminFetch } from "@/lib/admin-session";
import styles from "./AdminStockPage.module.css";

type InventoryRow = {
  wine_slug: string;
  stock_quantity: number;
  updated_at: string;
  name: string;
  vintage: string;
};

export function AdminStockPage() {
  const router = useRouter();
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadInventory = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await adminFetch("/api/admin/inventory");
      if (res.status === 401) {
        router.push("/admin");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Napaka pri branju zaloge.");
      }

      const inventory = (data.inventory ?? []) as InventoryRow[];
      setRows(inventory);
      setDrafts(
        Object.fromEntries(
          inventory.map((row) => [row.wine_slug, String(row.stock_quantity)])
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Napaka pri branju zaloge.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleSave = async (slug: string) => {
    const raw = drafts[slug];
    const quantity = parseInt(raw, 10);

    if (!Number.isFinite(quantity) || quantity < 0) {
      setError("Vnesi veljavno število (0 ali več).");
      return;
    }

    setSavingSlug(slug);
    setError("");
    setMessage("");

    try {
      const res = await adminFetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wine_slug: slug, stock_quantity: quantity }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Shranjevanje ni uspelo.");
      }

      setRows((prev) =>
        prev.map((row) =>
          row.wine_slug === slug
            ? { ...row, stock_quantity: data.stock_quantity, updated_at: data.updated_at }
            : row
        )
      );
      setDrafts((prev) => ({ ...prev, [slug]: String(data.stock_quantity) }));
      setMessage(`Zaloga za ${data.name} ${data.vintage} shranjena.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Shranjevanje ni uspelo.");
    } finally {
      setSavingSlug(null);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin");
    router.refresh();
  };

  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Fortis Admin</p>
            <h1 className={styles.title}>Zaloga vina</h1>
          </div>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            Odjava
          </button>
        </header>

        {loading ? <p className={styles.status}>Nalaganje …</p> : null}

        {!loading && rows.length === 0 ? (
          <p className={styles.status}>Ni zapisov zaloge.</p>
        ) : null}

        {!loading && rows.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vino</th>
                  <th>Trenutna zaloga</th>
                  <th>Nova zaloga</th>
                  <th aria-label="Dejanja" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.wine_slug}>
                    <td>
                      {row.name} {row.vintage}
                    </td>
                    <td>{row.stock_quantity}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        className={styles.input}
                        value={drafts[row.wine_slug] ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.wine_slug]: e.target.value,
                          }))
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.saveBtn}
                        disabled={savingSlug === row.wine_slug}
                        onClick={() => handleSave(row.wine_slug)}
                      >
                        {savingSlug === row.wine_slug ? "Shranjujem …" : "Shrani"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {message ? (
          <p className={styles.success} role="status">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
