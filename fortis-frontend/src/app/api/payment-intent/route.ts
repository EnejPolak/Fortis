import { NextResponse } from "next/server";
import {
  buildOrderSummary,
  checkoutMetadata,
  parseCheckoutItems,
  parseDeliveryMethod,
} from "@/lib/checkout";
import { assertItemsInStock } from "@/lib/inventory";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = parseCheckoutItems(body);

    if (!items?.length) {
      return NextResponse.json({ error: "Neveljavna košarica." }, { status: 400 });
    }

    const deliveryMethod = parseDeliveryMethod(body);
    const order = buildOrderSummary(items, deliveryMethod);
    if (!order) {
      return NextResponse.json({ error: "Vino ni najdeno." }, { status: 404 });
    }

    try {
      await assertItemsInStock(items);
    } catch (stockError) {
      const message =
        stockError instanceof Error ? stockError.message : "Ni dovolj zaloge.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.totalCents,
      currency: order.currency,
      automatic_payment_methods: { enabled: true },
      metadata: checkoutMetadata(items, deliveryMethod),
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      totalCents: order.totalCents,
      shippingCents: order.shippingCents,
      currency: order.currency,
      deliveryMethod,
    });
  } catch (error) {
    console.error("[payment-intent]", error);
    return NextResponse.json(
      { error: "Napaka pri pripravi plačila." },
      { status: 500 }
    );
  }
}
