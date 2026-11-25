import { NextResponse } from "next/server";
import { hashToken } from "@/lib/commerce/order-number";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Secure order lookup for confirmation page.
 * Requires either authenticated owner or guest access token.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("order")?.trim();
  const token = searchParams.get("token")?.trim();

  if (!orderNumber) {
    return NextResponse.json({ error: "Manjka številka naročila." }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Storitev ni na voljo." }, { status: 503 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, email, full_name, phone, fulfillment, shipping_address, billing_address, subtotal_cents, shipping_cents, total_cents, currency, payment_status, fulfillment_status, tracking_url, created_at, user_id, guest_access_token_hash, guest_access_token_expires_at"
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Naročilo ni najdeno." }, { status: 404 });
  }

  let allowed = false;

  if (token && order.guest_access_token_hash) {
    const hash = await hashToken(token);
    const tokenOk = hash === order.guest_access_token_hash;
    const expiresAt = (order as { guest_access_token_expires_at?: string | null })
      .guest_access_token_expires_at;
    const notExpired =
      !expiresAt || new Date(expiresAt).getTime() > Date.now();
    allowed = tokenOk && notExpired;
  }

  if (!allowed) {
    const userClient = await createServerSupabase();
    const {
      data: { user },
    } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    if (user && order.user_id === user.id) {
      allowed = true;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: "Dostop zavrnjen." }, { status: 403 });
  }

  const { data: items } = await supabase
    .from("order_items")
    .select(
      "variant_id, slug, product_name, brand, volume_label, image_src, quantity, unit_cents, line_cents"
    )
    .eq("order_id", order.id);

  const { guest_access_token_hash: _hash, user_id: _uid, ...safeOrder } = order;

  return NextResponse.json({
    order: safeOrder,
    items: items ?? [],
  });
}
