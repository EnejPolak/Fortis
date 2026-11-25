import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/commerce/admin";
import { getVariantById } from "@/lib/commerce/catalog";
import { getServiceSupabase } from "@/lib/supabase/admin";

const bodySchema = z.object({
  variantId: z.string().min(1),
  slug: z.string().min(1),
  /** Available free stock (excludes active reservations). */
  stockQuantity: z.number().int().min(0).max(100000),
  isActive: z.boolean(),
  sku: z.string().trim().max(64).nullable().optional(),
  unitCents: z.number().int().min(0).nullable().optional(),
  catalogueCents: z.number().int().min(0).optional(),
});

/**
 * Admin inventory update.
 * Sets product_inventory.stock_quantity (available units only).
 * Never modifies inventory_reservations.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase ni na voljo." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Neveljaven zahtevek." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Količina mora biti nenegativno celo število." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (!getVariantById(data.variantId)) {
    return NextResponse.json({ error: "Neznana različica." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("product_inventory")
    .select("variant_id, stock_quantity")
    .eq("variant_id", data.variantId)
    .maybeSingle();

  if (existing) {
    // Atomic adjust + audit row; does not touch reservations
    const { error: rpcError } = await supabase.rpc("admin_adjust_stock", {
      p_variant_id: data.variantId,
      p_new_quantity: data.stockQuantity,
      p_actor: admin.userId,
      p_note: "admin UI available stock",
    });

    if (rpcError) {
      console.error("admin_adjust_stock", rpcError.message);
      return NextResponse.json(
        { error: "Posodobitev zaloge ni uspela." },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from("product_inventory")
      .update({
        is_active: data.isActive,
        sku: data.sku ?? null,
        unit_cents: data.unitCents ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("variant_id", data.variantId);

    if (error) {
      return NextResponse.json({ error: "Posodobitev ni uspela." }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("product_inventory").insert({
      variant_id: data.variantId,
      slug: data.slug,
      stock_quantity: data.stockQuantity,
      is_active: data.isActive,
      sku: data.sku ?? null,
      unit_cents: data.unitCents ?? null,
    });
    if (error) {
      console.error("inventory insert", error.message);
      return NextResponse.json({ error: "Vnos ni uspel." }, { status: 500 });
    }

    await supabase.from("stock_movements").insert({
      variant_id: data.variantId,
      delta: data.stockQuantity,
      reason: "admin_adjust",
      actor_user_id: admin.userId,
      note: "initial inventory",
    });
  }

  const { data: reservedRows } = await supabase
    .from("inventory_reservations")
    .select("quantity")
    .eq("variant_id", data.variantId)
    .eq("status", "active");

  const reserved = (reservedRows ?? []).reduce(
    (sum, r) => sum + (r.quantity ?? 0),
    0
  );

  return NextResponse.json({
    ok: true,
    available: data.stockQuantity,
    reserved,
    physical: data.stockQuantity + reserved,
  });
}
