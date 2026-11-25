import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { enqueueOrderEmail, processEmailOutbox } from "@/lib/commerce/email";
import {
  commitReservations,
  releaseReservations,
} from "@/lib/commerce/inventory";
import { getStripe } from "@/stripe";
import { getServiceSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function loadOrderEmailContext(orderId: string) {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, email, full_name, fulfillment, total_cents, tracking_url"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, brand, volume_label, quantity, line_cents")
    .eq("order_id", orderId);

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    email: order.email,
    fullName: order.full_name,
    fulfillment: order.fulfillment,
    totalCents: order.total_cents,
    trackingUrl: order.tracking_url,
    items: items ?? [],
  };
}

/**
 * Mark order paid only when Stripe amount/currency/status match.
 * Never demotes an already-paid order.
 */
async function markPaid(
  orderId: string,
  opts: {
    paymentIntentId: string | null;
    sessionId: string | null;
    amountTotal: number | null;
    currency: string | null;
    paymentStatus: string | null;
  }
) {
  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false as const, reason: "no_supabase" };

  const { data: order } = await supabase
    .from("orders")
    .select("id, payment_status, total_cents, currency")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { ok: false as const, reason: "order_missing" };
  if (order.payment_status === "paid") {
    await commitReservations(supabase, orderId);
    return { ok: true as const, already: true };
  }

  if (opts.paymentStatus && opts.paymentStatus !== "paid") {
    return { ok: false as const, reason: "payment_not_paid" };
  }

  if (
    opts.amountTotal != null &&
    opts.amountTotal !== order.total_cents
  ) {
    console.error("stripe amount mismatch", {
      orderId,
      expected: order.total_cents,
      got: opts.amountTotal,
    });
    return { ok: false as const, reason: "amount_mismatch" };
  }

  if (
    opts.currency &&
    opts.currency.toLowerCase() !== (order.currency ?? "eur").toLowerCase()
  ) {
    console.error("stripe currency mismatch", orderId);
    return { ok: false as const, reason: "currency_mismatch" };
  }

  const { data: updated, error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: opts.paymentIntentId,
      stripe_checkout_session_id: opts.sessionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .neq("payment_status", "paid")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("markPaid update", error.message);
    return { ok: false as const, reason: "update_failed" };
  }

  // Race: another worker already paid — still commit reservations
  await commitReservations(supabase, orderId);

  if (updated) {
    const ctx = await loadOrderEmailContext(orderId);
    if (ctx) {
      await enqueueOrderEmail(supabase, "order_paid", ctx);
      // Best-effort immediate send; failures stay in outbox
      await processEmailOutbox(supabase, 5).catch(() => undefined);
    }
  }

  return { ok: true as const, already: false };
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
    if (insertError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("event log failed", insertError.message);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId =
          session.metadata?.order_id || session.client_reference_id || null;
        if (orderId) {
          await markPaid(orderId, {
            paymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id ?? null,
            sessionId: session.id,
            amountTotal: session.amount_total,
            currency: session.currency,
            paymentStatus: session.payment_status,
          });
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId =
          session.metadata?.order_id || session.client_reference_id || null;
        if (orderId) {
          await supabase
            .from("orders")
            .update({
              payment_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId)
            .eq("payment_status", "pending");
          await releaseReservations(supabase, orderId, "release");
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId =
          session.metadata?.order_id || session.client_reference_id || null;
        if (orderId) {
          const { data: order } = await supabase
            .from("orders")
            .select("payment_status")
            .eq("id", orderId)
            .maybeSingle();

          if (order?.payment_status === "paid") {
            // Late expire after paid — never demote
            await commitReservations(supabase, orderId);
          } else if (order?.payment_status === "pending") {
            await supabase
              .from("orders")
              .update({
                payment_status: "cancelled",
                updated_at: new Date().toISOString(),
              })
              .eq("id", orderId)
              .eq("payment_status", "pending");
            await releaseReservations(supabase, orderId, "expired");
          }
        }
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.order_id;
        if (orderId) {
          await markPaid(orderId, {
            paymentIntentId: pi.id,
            sessionId: null,
            amountTotal: pi.amount_received || pi.amount,
            currency: pi.currency,
            paymentStatus: "paid",
          });
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
    // Delete event id so Stripe retries (only if we inserted it this request)
    // Safer: return 500 without deleting — Stripe will retry; duplicate guard handles re-entry
    // But we already inserted event id — remove so retry can reprocess
    await supabase.from("processed_stripe_events").delete().eq("event_id", event.id);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
