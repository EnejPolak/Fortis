import type Stripe from "stripe";
import type { DeliveryMethod } from "@/lib/checkout";
import { getWineBySlug } from "@/data/wine";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/utils/supabase/admin";

export type SavedOrder = {
  id: string;
  stripe_payment_intent_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  fulfillment: DeliveryMethod;
  shipping_address: Record<string, string> | null;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  status: "paid" | "failed";
  created_at: string;
  items: {
    wine_slug: string;
    wine_name: string;
    wine_vintage: string;
    quantity: number;
    unit_cents: number;
    line_cents: number;
  }[];
};

type ShippingAddress = {
  line1: string;
  city: string;
  postal_code: string;
  country: string;
};

function parseMetadataItems(metadata: Stripe.Metadata): {
  slug: string;
  quantity: number;
}[] {
  const slugs = metadata.wine_slugs?.split(",").filter(Boolean) ?? [];
  const qtys = metadata.wine_qty?.split(",").map((q) => parseInt(q, 10)) ?? [];

  return slugs
    .map((slug, i) => ({
      slug: slug.trim(),
      quantity: Number.isFinite(qtys[i]) ? qtys[i] : 0,
    }))
    .filter((item) => item.slug && item.quantity > 0);
}

function formatShippingAddress(
  shipping: Stripe.PaymentIntent.Shipping | Stripe.Charge.Shipping | null
): ShippingAddress | null {
  if (!shipping?.address?.line1) return null;

  return {
    line1: shipping.address.line1,
    city: shipping.address.city ?? "",
    postal_code: shipping.address.postal_code ?? "",
    country: shipping.address.country ?? "",
  };
}

async function getExpandedPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });
}

function getChargeFromIntent(
  intent: Stripe.PaymentIntent
): Stripe.Charge | null {
  const latest = intent.latest_charge;
  if (!latest || typeof latest === "string") return null;
  return latest;
}

export async function saveOrderFromPaymentIntent(
  intent: Stripe.PaymentIntent
): Promise<SavedOrder | null> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_payment_intent_id", intent.id)
    .maybeSingle();

  if (existing) {
    const { data: full } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", existing.id)
      .single();

    if (!full) return null;

    return {
      id: full.id,
      stripe_payment_intent_id: full.stripe_payment_intent_id,
      email: full.email,
      full_name: full.full_name,
      phone: full.phone,
      fulfillment: full.fulfillment as DeliveryMethod,
      shipping_address: full.shipping_address,
      subtotal_cents: full.subtotal_cents,
      shipping_cents: full.shipping_cents,
      total_cents: full.total_cents,
      currency: full.currency,
      status: full.status,
      created_at: full.created_at,
      items: (full.order_items ?? []).map(
        (item: {
          wine_slug: string;
          wine_name: string;
          wine_vintage: string;
          quantity: number;
          unit_cents: number;
          line_cents: number;
        }) => ({
          wine_slug: item.wine_slug,
          wine_name: item.wine_name,
          wine_vintage: item.wine_vintage,
          quantity: item.quantity,
          unit_cents: item.unit_cents,
          line_cents: item.line_cents,
        })
      ),
    };
  }

  const fullIntent = await getExpandedPaymentIntent(intent.id);
  const charge = getChargeFromIntent(fullIntent);
  const billing = charge?.billing_details;

  const metadata = fullIntent.metadata ?? {};
  const fulfillment =
    metadata.fulfillment === "pickup" ? "pickup" : "delivery";
  const shippingCents = parseInt(metadata.shipping_cents ?? "0", 10) || 0;

  const metaItems = parseMetadataItems(metadata);
  if (!metaItems.length) {
    throw new Error(`No order items in metadata for PI ${intent.id}`);
  }

  const orderItems = metaItems.map(({ slug, quantity }) => {
    const wine = getWineBySlug(slug);
    if (!wine) throw new Error(`Unknown wine slug: ${slug}`);
    return {
      wine_slug: slug,
      wine_name: wine.name,
      wine_vintage: wine.vintage,
      quantity,
      unit_cents: wine.priceCents,
      line_cents: wine.priceCents * quantity,
    };
  });

  const subtotalCents = orderItems.reduce((sum, item) => sum + item.line_cents, 0);
  const totalCents = fullIntent.amount_received || fullIntent.amount;

  const email =
    billing?.email ?? fullIntent.receipt_email ?? "unknown@fortisniche.com";
  const fullName = billing?.name?.trim() || "Neznano";
  const phone = billing?.phone ?? null;

  const shippingAddress =
    fulfillment === "delivery"
      ? formatShippingAddress(charge?.shipping ?? fullIntent.shipping)
      : null;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      stripe_payment_intent_id: fullIntent.id,
      email,
      full_name: fullName,
      phone,
      fulfillment,
      shipping_address: shippingAddress,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      currency: fullIntent.currency,
      status: "paid",
    })
    .select("id, created_at")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Failed to insert order");
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    orderItems.map((item) => ({
      order_id: order.id,
      ...item,
    }))
  );

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return {
    id: order.id,
    stripe_payment_intent_id: fullIntent.id,
    email,
    full_name: fullName,
    phone,
    fulfillment,
    shipping_address: shippingAddress,
    subtotal_cents: subtotalCents,
    shipping_cents: shippingCents,
    total_cents: totalCents,
    currency: fullIntent.currency,
    status: "paid",
    created_at: order.created_at,
    items: orderItems,
  };
}

export async function markOrderFailed(paymentIntentId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("orders")
    .select("id, status")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (existing) {
    if (existing.status !== "paid") {
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", existing.id);
    }
    return;
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });

  const charge = getChargeFromIntent(intent);
  const billing = charge?.billing_details;
  const metadata = intent.metadata ?? {};
  const fulfillment =
    metadata.fulfillment === "pickup" ? "pickup" : "delivery";
  const shippingCents = parseInt(metadata.shipping_cents ?? "0", 10) || 0;

  const metaItems = parseMetadataItems(metadata);
  const orderItems = metaItems
    .map(({ slug, quantity }) => {
      const wine = getWineBySlug(slug);
      if (!wine) return null;
      return {
        wine_slug: slug,
        wine_name: wine.name,
        wine_vintage: wine.vintage,
        quantity,
        unit_cents: wine.priceCents,
        line_cents: wine.priceCents * quantity,
      };
    })
    .filter(Boolean) as SavedOrder["items"];

  const subtotalCents = orderItems.reduce((sum, item) => sum + item.line_cents, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      stripe_payment_intent_id: intent.id,
      email: billing?.email ?? intent.receipt_email ?? "unknown@fortisniche.com",
      full_name: billing?.name?.trim() || "Neznano",
      phone: billing?.phone ?? null,
      fulfillment,
      shipping_address: null,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: intent.amount,
      currency: intent.currency,
      status: "failed",
    })
    .select("id")
    .single();

  if (orderError || !order) return;

  if (orderItems.length) {
    await supabase.from("order_items").insert(
      orderItems.map((item) => ({
        order_id: order.id,
        ...item,
      }))
    );
  }
}

export async function pingDatabase(): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("orders").select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
}
