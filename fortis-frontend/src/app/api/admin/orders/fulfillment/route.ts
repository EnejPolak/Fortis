import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/commerce/admin";
import { enqueueOrderEmail, processEmailOutbox } from "@/lib/commerce/email";
import { canTransitionFulfillment } from "@/lib/commerce/fulfillment-transitions";
import { getServiceSupabase } from "@/lib/supabase/admin";

const bodySchema = z.object({
  orderNumber: z.string().min(1),
  status: z.enum([
    "unfulfilled",
    "ready",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  trackingUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

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
    return NextResponse.json({ error: "Preverite podatke." }, { status: 400 });
  }

  const { orderNumber, status, trackingUrl } = parsed.data;

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, email, full_name, fulfillment, total_cents, payment_status, fulfillment_status, tracking_url"
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Naročilo ni najdeno." }, { status: 404 });
  }

  if (order.payment_status !== "paid") {
    return NextResponse.json(
      { error: "Izpolnitev je dovoljena le za plačana naročila." },
      { status: 409 }
    );
  }

  if (status !== order.fulfillment_status) {
    if (!canTransitionFulfillment(order.fulfillment_status, status)) {
      return NextResponse.json(
        {
          error: `Prehod iz »${order.fulfillment_status}« v »${status}« ni dovoljen.`,
        },
        { status: 409 }
      );
    }
  }

  const { error } = await supabase
    .from("orders")
    .update({
      fulfillment_status: status,
      tracking_url: trackingUrl || order.tracking_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (error) {
    return NextResponse.json({ error: "Posodobitev ni uspela." }, { status: 500 });
  }

  if (status !== order.fulfillment_status) {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, brand, volume_label, quantity, line_cents")
      .eq("order_id", order.id);

    const ctx = {
      orderId: order.id,
      orderNumber: order.order_number,
      email: order.email,
      fullName: order.full_name,
      fulfillment: order.fulfillment,
      totalCents: order.total_cents,
      trackingUrl: trackingUrl || order.tracking_url,
      items: items ?? [],
    };

    if (status === "ready") {
      await enqueueOrderEmail(supabase, "ready_for_pickup", ctx);
    }
    if (status === "shipped") {
      await enqueueOrderEmail(supabase, "shipped", ctx);
    }
    await processEmailOutbox(supabase, 5).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
