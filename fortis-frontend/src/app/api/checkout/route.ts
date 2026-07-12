import { NextResponse } from "next/server";
import {
  buildStripeLineItems,
  checkoutMetadata,
  parseCheckoutItems,
} from "@/lib/checkout";
import { getStripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = parseCheckoutItems(body);

    if (!items?.length) {
      return NextResponse.json({ error: "Neveljavna košarica." }, { status: 400 });
    }

    const lineItems = buildStripeLineItems(items);
    if (!lineItems) {
      return NextResponse.json({ error: "Vino ni najdeno." }, { status: 404 });
    }

    const siteUrl = getSiteUrl();
    const stripe = getStripe();
    const fromCart = Boolean(body?.fromCart);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${siteUrl}/vino/uspeh?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: fromCart ? `${siteUrl}/kosarica` : `${siteUrl}/vino/${items[0].slug}`,
      metadata: checkoutMetadata(items, "delivery"),
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ["SI", "HR", "AT", "IT", "DE"],
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout seja ni na voljo." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout]", error);
    return NextResponse.json(
      { error: "Napaka pri ustvarjanju plačila." },
      { status: 500 }
    );
  }
}
