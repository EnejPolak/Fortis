import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { notifyNewOrder } from "@/lib/order-notify";
import { markOrderFailed, saveOrderFromPaymentIntent } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe-webhook] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.info("[stripe-webhook] checkout.session.completed", {
          sessionId: session.id,
          email: session.customer_details?.email,
        });
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.info("[stripe-webhook] checkout.session.expired", {
          sessionId: session.id,
        });
        break;
      }
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const order = await saveOrderFromPaymentIntent(intent);

        if (order) {
          try {
            await notifyNewOrder(order);
          } catch (notifyError) {
            console.error("[stripe-webhook] Order notify failed:", notifyError);
          }
        }

        console.info("[stripe-webhook] payment_intent.succeeded", {
          paymentIntentId: intent.id,
          orderId: order?.id,
        });
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await markOrderFailed(intent.id);
        console.info("[stripe-webhook] payment_intent.payment_failed", {
          paymentIntentId: intent.id,
        });
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[stripe-webhook] Handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
