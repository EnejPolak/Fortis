import type { SupabaseClient } from "@supabase/supabase-js";

export type ReserveItem = {
  variantId: string;
  quantity: number;
};

/** Stripe Checkout sessions expire after ~24h; keep reservation slightly shorter. */
export const RESERVATION_TTL_MS = 1000 * 60 * 60 * 23; // 23 hours

export function reservationExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + RESERVATION_TTL_MS);
}

export async function reserveStockForOrder(
  supabase: SupabaseClient,
  orderId: string,
  items: ReserveItem[],
  expiresAt: Date
): Promise<{ ok: true } | { ok: false; error: string; code?: string }> {
  const payload = items.map((i) => ({
    variant_id: i.variantId,
    quantity: i.quantity,
  }));

  const { error } = await supabase.rpc("reserve_stock_for_order", {
    p_order_id: orderId,
    p_items: payload,
    p_expires_at: expiresAt.toISOString(),
  });

  if (!error) return { ok: true };

  const msg = error.message ?? "";
  if (msg.includes("INSUFFICIENT_STOCK")) {
    return {
      ok: false,
      code: "INSUFFICIENT_STOCK",
      error: "Izbrana količina ni več na voljo.",
    };
  }
  if (msg.includes("NO_INVENTORY")) {
    return {
      ok: false,
      code: "NO_INVENTORY",
      error: "Izdelek ni na zalogi (zaloga ni vpisana).",
    };
  }
  console.error("reserve_stock_for_order", error.message);
  return { ok: false, error: "Zaloge ni bilo mogoče rezervirati." };
}

export async function commitReservations(
  supabase: SupabaseClient,
  orderId: string
): Promise<void> {
  const { error } = await supabase.rpc("commit_reservations_for_order", {
    p_order_id: orderId,
  });
  if (error) {
    console.error("commit_reservations", error.message);
  }
}

export async function releaseReservations(
  supabase: SupabaseClient,
  orderId: string,
  reason: "release" | "expired" = "release"
): Promise<void> {
  const { error } = await supabase.rpc("release_reservations_for_order", {
    p_order_id: orderId,
    p_reason: reason,
  });
  if (error) {
    console.error("release_reservations", error.message);
  }
}

export async function releaseStaleReservations(
  supabase: SupabaseClient,
  limit = 100
): Promise<number> {
  const { data, error } = await supabase.rpc("release_stale_reservations", {
    p_limit: limit,
  });
  if (error) {
    console.error("release_stale_reservations", error.message);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}
