import Link from "next/link";
import { getServiceSupabase } from "@/lib/supabase/admin";

export default async function AdminHomePage() {
  const supabase = getServiceSupabase();

  let pending = 0;
  let paidUnfulfilled = 0;
  let lowStock = 0;

  if (supabase) {
    const { count: p } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "pending");
    pending = p ?? 0;

    const { count: u } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "paid")
      .eq("fulfillment_status", "unfulfilled");
    paidUnfulfilled = u ?? 0;

    const { count: s } = await supabase
      .from("product_inventory")
      .select("variant_id", { count: "exact", head: true })
      .lte("stock_quantity", 2)
      .eq("is_active", true);
    lowStock = s ?? 0;
  }

  return (
    <div>
      <h1 className="shop-title">Skrbništvo</h1>
      <p className="shop-lead">
        Minimalni nadzor zaloge, naročil in prevzema — strežniško zaščiteno.
      </p>
      <ul className="admin-stats">
        <li>
          <span>Odprta plačila</span>
          <strong>{pending}</strong>
        </li>
        <li>
          <span>Plačano, neizpolnjeno</span>
          <strong>{paidUnfulfilled}</strong>
        </li>
        <li>
          <span>Nizka zaloga (≤2)</span>
          <strong>{lowStock}</strong>
        </li>
      </ul>
      <div className="admin-actions">
        <Link href="/admin/narocila" className="shop-primary">
          Naročila
        </Link>
        <Link href="/admin/zaloga" className="shop-secondary">
          Zaloga
        </Link>
      </div>
    </div>
  );
}
