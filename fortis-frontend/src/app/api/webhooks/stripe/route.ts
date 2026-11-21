import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getServiceSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function markPaid(
  orderId: string,
  paymentIntentId: string | null,
  sessionId: string | null
) {
  const supabase = getServiceSupabase();
  if (!supabase) return;

  const { data: order } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return;
  if (order.payment_status === "paid") return;

  await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntentId,
      stripe_checkout_session_id: sessionId,
      fulfillment_status: "unfulfilled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .neq("payment_status", "paid");

  // Decrement inventory when tracked rows exist (best-effort, idempotent via paid guard)
  const { data: items } = await supabase
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", orderId);

  for (const item of items ?? []) {
    const { data: inv } = await supabase
      .from("product_inventory")
      .select("stock_quantity")
      .eq("variant_id", item.variant_id)
      .maybeSingle();

    if (!inv) continue;
    const next = Math.max(0, (inv.stock_quantity ?? 0) - item.quantity);
    await supabase
      .from("product_inventory")
      .update({ stock_quantity: next, updated_at: new Date().toISOString() })
      .eq("variant_id", item.variant_id);
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const supabase = getServiceSupabase();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  if (!webhookSecret || webhookSecret.includes("...")) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { error: insertError } = await supabase
    .from("processed_stripe_events")
    .insert({ event_id: event.id });

  if (insertError) {
    // Already processed
    if (insertError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("event log failed", insertError.message);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId =
          session.metadata?.order_id || session.client_reference_id || null;
        if (orderId && session.payment_status === "paid") {
          await markPaid(
            orderId,
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
            session.id
          );
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId =
          session.metadata?.order_id || session.client_reference_id || null;
        if (orderId) {
          await supabase
            .from("orders")
            .update({
              payment_status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId)
            .eq("payment_status", "pending");
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.order_id;
        if (orderId) {
          await supabase
            .from("orders")
            .update({
              payment_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId)
            .eq("payment_status", "pending");
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("webhook handler error", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
