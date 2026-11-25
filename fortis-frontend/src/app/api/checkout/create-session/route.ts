import { NextResponse } from "next/server";
import { z } from "zod";
import { getFulfillmentOption } from "@/lib/commerce/shipping";
import { validateCartLines } from "@/lib/commerce/validate-cart";
import {
  createGuestAccessToken,
  createOrderNumber,
  hashToken,
} from "@/lib/commerce/order-number";
import {
  releaseReservations,
  reservationExpiresAt,
  reserveStockForOrder,
} from "@/lib/commerce/inventory";
import { rateLimit } from "@/lib/commerce/rate-limit";
import { getStripe, isStripeTestMode } from "@/stripe";
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
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

const GUEST_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function POST(request: Request) {
  const stripe = getStripe();
  const supabaseAdmin = getServiceSupabase();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const limited = rateLimit(`checkout:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Preveč poskusov. Poskusite znova čez trenutek." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      }
    );
  }

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
  const idempotencyKey =
    data.idempotencyKey?.trim() ||
    request.headers.get("idempotency-key")?.trim() ||
    null;

  if (idempotencyKey) {
    const { data: existingKey } = await supabaseAdmin
      .from("checkout_idempotency_keys")
      .select("order_id, stripe_checkout_session_id")
      .eq("key", idempotencyKey)
      .maybeSingle();

    if (existingKey?.stripe_checkout_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(
          existingKey.stripe_checkout_session_id
        );
        if (session.url && session.status !== "expired") {
          const { data: existingOrder } = await supabaseAdmin
            .from("orders")
            .select("order_number")
            .eq("id", existingKey.order_id)
            .maybeSingle();
          return NextResponse.json({
            url: session.url,
            orderNumber: existingOrder?.order_number,
            testMode: isStripeTestMode(),
            idempotent: true,
          });
        }
      } catch {
        /* fall through and create fresh if session gone */
      }
    }
  }

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
  const taxCents = 0; // tax treatment not configured — do not invent rates
  const totalCents = subtotalCents + shippingCents + taxCents;

  const userClient = await createServerSupabase();
  const {
    data: { user },
  } = userClient ? await userClient.auth.getUser() : { data: { user: null } };

  const orderNumber = createOrderNumber();
  const guestToken = createGuestAccessToken();
  const guestTokenHash = await hashToken(guestToken);
  const guestExpires = new Date(Date.now() + GUEST_TOKEN_TTL_MS);
  const reserveExpires = reservationExpiresAt();

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
      tax_cents: taxCents,
      total_cents: totalCents,
      currency: "eur",
      payment_status: "pending",
      fulfillment_status: "unfulfilled",
      guest_access_token_hash: guestTokenHash,
      guest_access_token_expires_at: guestExpires.toISOString(),
      checkout_idempotency_key: idempotencyKey,
      reservation_expires_at: reserveExpires.toISOString(),
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    if (orderError?.code === "23505" && idempotencyKey) {
      return NextResponse.json(
        { error: "Zahtevek se že obdeluje. Poskusite znova čez trenutek." },
        { status: 409 }
      );
    }
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
    sku: line.sku,
    quantity: line.quantity,
    unit_cents: line.unitCents,
    line_cents: line.lineCents,
    currency: "eur",
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

  const reserved = await reserveStockForOrder(
    supabaseAdmin,
    order.id,
    validated.lines.map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
    })),
    reserveExpires
  );

  if (!reserved.ok) {
    await supabaseAdmin.from("orders").delete().eq("id", order.id);
    return NextResponse.json(
      { error: reserved.error },
      { status: reserved.code === "INSUFFICIENT_STOCK" ? 409 : 409 }
    );
  }

  if (idempotencyKey) {
    await supabaseAdmin.from("checkout_idempotency_keys").upsert({
      key: idempotencyKey,
      order_id: order.id,
    });
  }

  const base = getSiteUrl();
  const successUrl = `${base}/narocilo/potrditev?order=${encodeURIComponent(order.order_number)}&token=${encodeURIComponent(guestToken)}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${base}/checkout?cancelled=1&order=${encodeURIComponent(order.order_number)}`;

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: data.email,
        client_reference_id: order.id,
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
        },
        payment_intent_data: {
          metadata: {
            order_id: order.id,
            order_number: order.order_number,
          },
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
        expires_at: Math.floor(reserveExpires.getTime() / 1000),
      },
      idempotencyKey
        ? { idempotencyKey: `checkout:${idempotencyKey}` }
        : undefined
    );

    await supabaseAdmin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    if (idempotencyKey) {
      await supabaseAdmin
        .from("checkout_idempotency_keys")
        .update({ stripe_checkout_session_id: session.id })
        .eq("key", idempotencyKey);
    }

    return NextResponse.json({
      url: session.url,
      orderNumber: order.order_number,
      guestToken,
      testMode: isStripeTestMode(),
    });
  } catch (err) {
    console.error("stripe session error", err instanceof Error ? err.message : err);
    await releaseReservations(supabaseAdmin, order.id, "release");
    await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
    return NextResponse.json(
      { error: "Plačilne seje ni bilo mogoče ustvariti." },
      { status: 502 }
    );
  }
}
