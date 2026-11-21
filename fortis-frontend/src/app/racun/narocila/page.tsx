import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatEurFromCents } from "@/lib/commerce/money";

const PAYMENT_LABEL: Record<string, string> = {
  pending: "Plačilo v teku",
  paid: "Plačano",
  failed: "Plačilo ni uspelo",
  cancelled: "Preklicano",
};

const FULFILLMENT_LABEL: Record<string, string> = {
  unfulfilled: "V pripravi",
  ready: "Pripravljeno za prevzem",
  shipped: "Odposlano",
  delivered: "Dostavljeno",
  cancelled: "Preklicano",
};

export default async function OrdersPage() {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return <p className="shop-banner shop-banner--error">Račun ni na voljo.</p>;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "order_number, created_at, total_cents, payment_status, fulfillment_status"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!orders?.length) {
    return (
      <div>
        <p className="shop-lead">Še nimate naročil.</p>
        <Link href="/kolekcija" className="shop-secondary">
          Pojdi v kolekcijo
        </Link>
      </div>
    );
  }

  return (
    <ul className="order-list">
      {orders.map((order) => (
        <li key={order.order_number}>
          <Link
            href={`/racun/narocila/${encodeURIComponent(order.order_number)}`}
            className="order-list-item"
          >
            <span className="order-list-id">{order.order_number}</span>
            <span className="order-list-meta">
              {new Date(order.created_at).toLocaleDateString("sl-SI")} ·{" "}
              {PAYMENT_LABEL[order.payment_status] ?? order.payment_status} ·{" "}
              {FULFILLMENT_LABEL[order.fulfillment_status] ??
                order.fulfillment_status}
            </span>
            <span className="order-list-meta">
              {formatEurFromCents(order.total_cents)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
