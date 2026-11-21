import { NextResponse } from "next/server";
import { getVariantById } from "@/lib/commerce/catalog";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { CART_MAX_LINE_QTY } from "@/lib/cart/types";

/**
 * Returns stock for variant ids.
 * If inventory table is missing/unconfigured, returns null stock
 * (client uses CART_MAX_LINE_QTY as soft cap — not a production guarantee).
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

    const slugs = [
      ...new Set(
        ids
          .map((id) => getVariantById(id)?.slug)
          .filter((s): s is string => Boolean(s))
      ),
    ];

    if (slugs.length === 0) {
      return NextResponse.json({ stock, mode: "tracked" });
    }

    const { data, error } = await supabase
      .from("product_inventory")
      .select("variant_id, stock_quantity")
      .in("variant_id", ids);

    if (error) {
      // Fallback: try slug-based rows
      const bySlug = await supabase
        .from("product_inventory")
        .select("variant_id, stock_quantity")
        .in("slug", slugs);

      if (bySlug.error) {
        return NextResponse.json({ stock, mode: "untracked" });
      }

      for (const row of bySlug.data ?? []) {
        stock[row.variant_id] = Math.min(
          CART_MAX_LINE_QTY,
          Math.max(0, row.stock_quantity ?? 0)
        );
      }
      return NextResponse.json({ stock, mode: "tracked" });
    }

    for (const row of data ?? []) {
      stock[row.variant_id] = Math.min(
        CART_MAX_LINE_QTY,
        Math.max(0, row.stock_quantity ?? 0)
      );
    }

    return NextResponse.json({ stock, mode: "tracked" });
  } catch {
    return NextResponse.json({ stock, mode: "untracked" });
  }
}
