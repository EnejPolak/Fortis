import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatEurFromCents } from "@/lib/commerce/money";

type Props = { params: Promise<{ orderNumber: string }> };

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

export default async function OrderDetailPage({ params }: Props) {
  const { orderNumber } = await params;
  const supabase = await createServerSupabase();
  if (!supabase) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", decodeURIComponent(orderNumber))
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  const address = order.shipping_address as {
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  } | null;

  return (
    <div>
      <p className="shop-lead">
        <Link href="/racun/narocila" className="shop-secondary">
          ← Nazaj na naročila
        </Link>
      </p>
      <h2 className="shop-section-title">{order.order_number}</h2>
      <p className="order-list-meta">
        {new Date(order.created_at).toLocaleString("sl-SI")}
      </p>
      <p className="order-list-meta">
        Plačilo: {PAYMENT_LABEL[order.payment_status] ?? order.payment_status}
        <br />
        Dostava/prevzem:{" "}
        {FULFILLMENT_LABEL[order.fulfillment_status] ?? order.fulfillment_status}
      </p>

      <section className="shop-section">
        <h3 className="shop-section-title">Izdelki</h3>
        {(items ?? []).map((item) => (
          <div key={item.id} className="shop-summary-line">
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
      </section>

      <section className="shop-section">
        <h3 className="shop-section-title">Podatki</h3>
        <p className="shop-lead" style={{ marginBottom: 0 }}>
          {order.full_name}
          <br />
          {order.email}
          {order.phone ? (
            <>
              <br />
              {order.phone}
            </>
          ) : null}
        </p>
        {address ? (
          <p className="shop-lead">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            <br />
            {address.postalCode} {address.city}
          </p>
        ) : (
          <p className="shop-lead">Osebni prevzem v ateljeju.</p>
        )}
        {order.tracking_url ? (
          <p>
            <a
              href={order.tracking_url}
              className="shop-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sledenje pošiljki
            </a>
          </p>
        ) : null}
        <p className="purchase-feedback-msg purchase-feedback-msg--muted">
          Podpora:{" "}
          <a href="/contact" className="shop-secondary">
            Kontakt
          </a>
        </p>
      </section>
    </div>
  );
}
