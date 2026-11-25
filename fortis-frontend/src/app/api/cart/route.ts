import { NextResponse } from "next/server";
import { z } from "zod";
import { mergeCartLines, parseStoredCart } from "@/lib/cart/cart-logic";
import type { CartLine, CartState } from "@/lib/cart/types";
import { getVariantById } from "@/lib/commerce/catalog";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const lineSchema = z.object({
  variantId: z.string().min(1),
  slug: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

const putSchema = z.object({
  lines: z.array(lineSchema).max(50),
  merge: z.boolean().optional(),
});

async function getUserCart(userId: string): Promise<CartState> {
  const supabase = getServiceSupabase();
  if (!supabase) return { lines: [], updatedAt: new Date().toISOString() };

  const { data: cart } = await supabase
    .from("carts")
    .select("id, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!cart) {
    return { lines: [], updatedAt: new Date().toISOString() };
  }

  const { data: items } = await supabase
    .from("cart_items")
    .select("variant_id, slug, quantity")
    .eq("cart_id", cart.id);

  const lines: CartLine[] = (items ?? [])
    .map((i) => ({
      variantId: i.variant_id,
      slug: i.slug,
      quantity: i.quantity,
    }))
    .filter((l) => getVariantById(l.variantId));

  return { lines, updatedAt: cart.updated_at };
}

async function saveUserCart(userId: string, lines: CartLine[]): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) return;

  let cartId: string | null = null;
  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    cartId = existing.id;
    await supabase
      .from("carts")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", cartId);
  } else {
    const { data: created } = await supabase
      .from("carts")
      .insert({ user_id: userId })
      .select("id")
      .single();
    cartId = created?.id ?? null;
  }

  if (!cartId) return;

  await supabase.from("cart_items").delete().eq("cart_id", cartId);

  if (lines.length === 0) return;

  await supabase.from("cart_items").insert(
    lines.map((l) => ({
      cart_id: cartId!,
      variant_id: l.variantId,
      slug: l.slug,
      quantity: l.quantity,
    }))
  );
}

/** GET — authenticated cart (empty if guest). */
export async function GET() {
  const userClient = await createServerSupabase();
  if (!userClient) {
    return NextResponse.json({ lines: [], updatedAt: new Date().toISOString() });
  }
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ lines: [], updatedAt: new Date().toISOString() });
  }
  const cart = await getUserCart(user.id);
  return NextResponse.json(cart);
}

/**
 * PUT — replace or merge cart for authenticated user.
 * Merge rule: sum quantities per variantId, clamp later via stock API.
 */
export async function PUT(request: Request) {
  const userClient = await createServerSupabase();
  if (!userClient) {
    return NextResponse.json({ error: "Storitev ni na voljo." }, { status: 503 });
  }
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Prijava je obvezna." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Neveljaven zahtevek." }, { status: 400 });
  }

  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neveljavna košarica." }, { status: 400 });
  }

  const incoming = parseStoredCart({
    lines: parsed.data.lines,
    updatedAt: new Date().toISOString(),
  });
  if (!incoming) {
    return NextResponse.json({ error: "Neveljavna košarica." }, { status: 400 });
  }

  let lines = incoming.lines;
  if (parsed.data.merge) {
    const existing = await getUserCart(user.id);
    lines = mergeCartLines(existing.lines, incoming.lines);
  }

  await saveUserCart(user.id, lines);
  return NextResponse.json({
    lines,
    updatedAt: new Date().toISOString(),
  });
}
