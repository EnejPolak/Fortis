import { NextResponse } from "next/server";
import { getVariantById } from "@/lib/commerce/catalog";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { CART_MAX_LINE_QTY } from "@/lib/cart/types";

/**
 * Returns stock for variant ids.
 * When inventory rows exist: reported quantity (capped).
 * When inventory row is missing: 0 (never unlimited).
 * When Supabase is unconfigured: null (soft UI cap only — checkout will refuse).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);

  const stock: Record<string, number | null> = {};
  for (const id of ids) {
    stock[id] = getVariantById(id) ? null : 0;
  }

  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ stock, mode: "untracked" });
    }

    if (ids.length === 0) {
      return NextResponse.json({ stock, mode: "tracked" });
    }

    const { data, error } = await supabase
      .from("product_inventory")
      .select("variant_id, stock_quantity, is_active")
      .in("variant_id", ids);

    if (error) {
      console.error("stock query", error.message);
      return NextResponse.json({ stock, mode: "untracked" });
    }

    // Default missing rows to 0 once inventory table is reachable
    for (const id of ids) {
      if (getVariantById(id)) stock[id] = 0;
    }

    for (const row of data ?? []) {
      if (row.is_active === false) {
        stock[row.variant_id] = 0;
      } else {
        stock[row.variant_id] = Math.min(
          CART_MAX_LINE_QTY,
          Math.max(0, row.stock_quantity ?? 0)
        );
      }
    }

    return NextResponse.json({ stock, mode: "tracked" });
  } catch {
    return NextResponse.json({ stock, mode: "untracked" });
  }
}
