import { NextResponse } from "next/server";
import { processEmailOutbox } from "@/lib/commerce/email";
import { releaseStaleReservations } from "@/lib/commerce/inventory";
import { getServiceSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Scheduled reconciliation: stale inventory reservations + email outbox retries.
 * Protect with CRON_SECRET (Authorization: Bearer … or ?secret=).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.includes("...")) {
    return NextResponse.json(
      { error: "CRON_SECRET ni nastavljen." },
      { status: 503 }
    );
  }

  const auth = request.headers.get("authorization");
  const url = new URL(request.url);
  const ok =
    auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret;

  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase ni na voljo." }, { status: 503 });
  }

  const released = await releaseStaleReservations(supabase, 100);
  const email = await processEmailOutbox(supabase, 30);

  return NextResponse.json({
    ok: true,
    releasedReservations: released,
    email,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
