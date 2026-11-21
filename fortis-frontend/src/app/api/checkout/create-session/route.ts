import { NextResponse } from "next/server";
import { z } from "zod";
import { getFulfillmentOption } from "@/lib/commerce/shipping";
import { validateCartLines } from "@/lib/commerce/validate-cart";
import {
  createGuestAccessToken,
  createOrderNumber,
  hashToken,
} from "@/lib/commerce/order-number";
import { getStripe, isStripeTestMode } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  line1: z.string().trim().min(2).max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2).default("SI"),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

const bodySchema = z.object({
  email: z.string().trim().email().max(200),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  fulfillment: z.enum(["pickup", "delivery"]),
  shippingAddress: addressSchema.optional(),
  billingSameAsShipping: z.boolean().default(true),
  billingAddress: addressSchema.optional(),
  lines: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(50),
});

export async function POST(request: Request) {
  const stripe = getStripe();
  const supabaseAdmin = getServiceSupabase();

  if (!stripe || !supabaseAdmin) {
    return NextResponse.json(
      {
        error:
          "Blagajna še ni v celoti konfigurirana. Manjkajo Stripe ali Supabase poverilnice.",
      },
      { status: 503 }
    );
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
      { error: "Preverite vnesene podatke.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const fulfillment = getFulfillmentOption(data.fulfillment);
  if (!fulfillment?.available) {
    return NextResponse.json(
      {
        error:
          fulfillment?.unavailableReason ??
          "Izbrani način prevzema ni na voljo.",
      },
      { status: 400 }
    );
  }

  if (data.fulfillment === "delivery" && !data.shippingAddress) {
    return NextResponse.json(
      { error: "Za dostavo je potreben naslov." },
      { status: 400 }
    );
  }

  const validated = await validateCartLines(data.lines);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error, fieldErrors: validated.fieldErrors },
      { status: 409 }
    );
  }

  const shippingCents = fulfillment.cents;
  const subtotalCents = validated.subtotalCents;
  const totalCents = subtotalCents + shippingCents;

  const userClient = await createServerSupabase();
  const {
    data: { user },
  } = userClient ? await userClient.auth.getUser() : { data: { user: null } };

  const orderNumber = createOrderNumber();
  const guestToken = createGuestAccessToken();
  const guestTokenHash = await hashToken(guestToken);

  const shippingAddress =
    data.fulfillment === "delivery" ? data.shippingAddress : null;
  const billingAddress =
    data.billingSameAsShipping !== false
      ? shippingAddress
      : data.billingAddress ?? shippingAddress;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: user?.id ?? null,
      email: data.email.toLowerCase(),
      full_name: data.fullName,
      phone: data.phone || null,
      fulfillment: data.fulfillment,
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      currency: "eur",
      payment_status: "pending",
      fulfillment_status: "unfulfilled",
      guest_access_token_hash: guestTokenHash,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    console.error("order insert failed", orderError?.message);
    return NextResponse.json(
      { error: "Naročila ni bilo mogoče ustvariti. Poskusite znova." },
      { status: 500 }
    );
  }

  const itemRows = validated.lines.map((line) => ({
    order_id: order.id,
    variant_id: line.variantId,
    slug: line.slug,
    product_name: line.productName,
    brand: line.brand,
    volume_label: line.volumeLabel,
    image_src: line.imageSrc,
    quantity: line.quantity,
    unit_cents: line.unitCents,
    line_cents: line.lineCents,
  }));

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(itemRows);

  if (itemsError) {
    await supabaseAdmin.from("orders").delete().eq("id", order.id);
    console.error("order items insert failed", itemsError.message);
    return NextResponse.json(
      { error: "Naročila ni bilo mogoče ustvariti. Poskusite znova." },
      { status: 500 }
    );
  }

  const base = getSiteUrl();
  const successUrl = `${base}/narocilo/potrditev?order=${encodeURIComponent(order.order_number)}&token=${encodeURIComponent(guestToken)}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${base}/checkout?cancelled=1&order=${encodeURIComponent(order.order_number)}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: data.email,
      client_reference_id: order.id,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
      },
      line_items: [
        ...validated.lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: "eur",
            unit_amount: line.unitCents,
            product_data: {
              name: `${line.brand} — ${line.productName}`,
              description: line.volumeLabel,
            },
          },
        })),
        ...(shippingCents > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: "eur",
                  unit_amount: shippingCents,
                  product_data: {
                    name: fulfillment.label,
                  },
                },
              },
            ]
          : []),
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    await supabaseAdmin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    return NextResponse.json({
      url: session.url,
      orderNumber: order.order_number,
      testMode: isStripeTestMode(),
    });
  } catch (err) {
    console.error("stripe session error", err instanceof Error ? err.message : err);
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", order.id);
    return NextResponse.json(
      { error: "Plačilne seje ni bilo mogoče ustvariti." },
      { status: 502 }
    );
  }
}
