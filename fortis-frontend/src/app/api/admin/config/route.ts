import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/commerce/admin";
import { getServiceSupabase } from "@/lib/supabase/admin";

const bodySchema = z.object({
  deliveryEnabled: z.boolean(),
  deliveryCents: z.number().int().min(0).nullable(),
});

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase ni na voljo." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Neveljaven zahtevek." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Preverite podatke." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("store_config")
    .select("value")
    .eq("key", "fulfillment")
    .maybeSingle();

  const value = {
    ...(typeof existing?.value === "object" && existing.value
      ? existing.value
      : {}),
    delivery: {
      enabled: parsed.data.deliveryEnabled,
      cents: parsed.data.deliveryCents,
      label: "Dostava",
      requires_address: true,
    },
  };

  const { error } = await supabase.from("store_config").upsert({
    key: "fulfillment",
    value,
    updated_at: new Date().toISOString(),
    updated_by: admin.userId,
  });

  if (error) {
    return NextResponse.json({ error: "Shranjevanje ni uspelo." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
