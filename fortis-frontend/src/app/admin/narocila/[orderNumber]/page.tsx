import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminFulfillmentForm } from "@/components/admin/AdminFulfillmentForm";
import { formatEurFromCents } from "@/lib/commerce/money";
import { getServiceSupabase } from "@/lib/supabase/admin";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const supabase = getServiceSupabase();
  if (!supabase) notFound();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", decodeURIComponent(orderNumber))
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  return (
    <div>
      <Link href="/admin/narocila" className="shop-secondary">
        ← Naročila
      </Link>
      <h1 className="shop-title">{order.order_number}</h1>
      <p className="shop-lead">
        {order.full_name} · {order.email}
        {order.phone ? ` · ${order.phone}` : ""}
      </p>
      <p className="shop-lead">
        Plačilo: {order.payment_status} · Izpolnitev: {order.fulfillment_status}{" "}
        · {order.fulfillment === "pickup" ? "Prevzem" : "Dostava"}
      </p>

      <ul className="admin-order-items">
        {(items ?? []).map((item) => (
          <li key={item.id}>
            {item.brand} — {item.product_name} ({item.volume_label}) ×{" "}
            {item.quantity} — {formatEurFromCents(item.line_cents)}
          </li>
        ))}
      </ul>
      <p className="shop-lead">
        Skupaj: <strong>{formatEurFromCents(order.total_cents)}</strong>
      </p>

      {order.payment_status === "paid" ? (
        <AdminFulfillmentForm
          orderNumber={order.order_number}
          currentStatus={order.fulfillment_status}
          fulfillment={order.fulfillment}
          trackingUrl={order.tracking_url ?? ""}
        />
      ) : (
        <p className="shop-banner">
          Status izpolnitve lahko spremenite šele po potrjenem plačilu.
        </p>
      )}
    </div>
  );
}
