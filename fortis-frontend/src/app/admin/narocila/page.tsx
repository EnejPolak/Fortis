import Link from "next/link";
import { formatEurFromCents } from "@/lib/commerce/money";
import { getServiceSupabase } from "@/lib/supabase/admin";

const PAYMENT: Record<string, string> = {
  pending: "V teku",
  paid: "Plačano",
  failed: "Ni uspelo",
  cancelled: "Preklicano",
};

const FULFILLMENT: Record<string, string> = {
  unfulfilled: "Neizpolnjeno",
  ready: "Pripravljeno",
  shipped: "Odposlano",
  delivered: "Zaključeno",
  cancelled: "Preklicano",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payment?: string }>;
}) {
  const sp = await searchParams;
  const supabase = getServiceSupabase();
  if (!supabase) {
    return <p className="shop-banner shop-banner--error">Supabase ni na voljo.</p>;
  }

  let query = supabase
    .from("orders")
    .select(
      "order_number, email, full_name, total_cents, payment_status, fulfillment_status, fulfillment, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (sp.payment) query = query.eq("payment_status", sp.payment);
  if (sp.status) query = query.eq("fulfillment_status", sp.status);

  const { data: orders } = await query;

  return (
    <div>
      <h1 className="shop-title">Naročila</h1>
      <div className="admin-filters">
        <Link href="/admin/narocila">Vsa</Link>
        <Link href="/admin/narocila?payment=paid">Plačana</Link>
        <Link href="/admin/narocila?status=unfulfilled&payment=paid">
          Za pripravo
        </Link>
        <Link href="/admin/narocila?status=ready">Za prevzem</Link>
      </div>
      <ul className="order-list">
        {(orders ?? []).map((o) => (
          <li key={o.order_number}>
            <Link
              href={`/admin/narocila/${encodeURIComponent(o.order_number)}`}
              className="order-list-item"
            >
              <span className="order-list-id">{o.order_number}</span>
              <span className="order-list-meta">
                {o.full_name} · {o.email}
              </span>
              <span className="order-list-meta">
                {PAYMENT[o.payment_status] ?? o.payment_status} ·{" "}
                {FULFILLMENT[o.fulfillment_status] ?? o.fulfillment_status} ·{" "}
                {formatEurFromCents(o.total_cents)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!orders?.length ? <p className="shop-lead">Ni naročil.</p> : null}
    </div>
  );
}
