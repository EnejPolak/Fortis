import type { SupabaseClient } from "@supabase/supabase-js";
import { formatEurFromCents } from "@/lib/commerce/money";
import { ATELIER_ADDRESS_LINE } from "@/lib/commerce/atelier";

export type EmailTemplate =
  | "order_paid"
  | "ready_for_pickup"
  | "shipped";

type OrderEmailContext = {
  orderId: string;
  orderNumber: string;
  email: string;
  fullName: string;
  fulfillment: string;
  totalCents: number;
  items: Array<{
    product_name: string;
    brand: string;
    volume_label: string;
    quantity: number;
    line_cents: number;
  }>;
  trackingUrl?: string | null;
};

export function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY?.trim();
  return Boolean(key && !key.includes("..."));
}

/**
 * When set, all transactional mail is delivered only to this address
 * (original recipient remains in the subject/body for debugging).
 * Never send live customer mail while testing.
 */
export function getEmailTestRecipient(): string | null {
  const v = process.env.EMAIL_TEST_RECIPIENT?.trim();
  if (!v || !v.includes("@")) return null;
  return v.toLowerCase();
}

function fromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.ORDER_NOTIFY_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "FORTIS Niche Atelier <onboarding@resend.dev>"
  );
}

function buildSubject(template: EmailTemplate, orderNumber: string): string {
  switch (template) {
    case "order_paid":
      return `Potrditev naročila ${orderNumber} — FORTIS`;
    case "ready_for_pickup":
      return `Naročilo ${orderNumber} je pripravljeno za prevzem`;
    case "shipped":
      return `Naročilo ${orderNumber} je odposlano`;
  }
}

function buildHtml(template: EmailTemplate, ctx: OrderEmailContext): string {
  const lines = ctx.items
    .map(
      (i) =>
        `<li>${i.brand} — ${i.product_name} (${i.volume_label}) × ${i.quantity} — ${formatEurFromCents(i.line_cents)}</li>`
    )
    .join("");

  if (template === "order_paid") {
    const fulfillment =
      ctx.fulfillment === "pickup"
        ? `Osebni prevzem: ${ATELIER_ADDRESS_LINE}`
        : "Dostava na navedeni naslov.";
    return `
      <p>Spoštovani/a ${ctx.fullName},</p>
      <p>prejeli smo plačilo za naročilo <strong>${ctx.orderNumber}</strong>.</p>
      <ul>${lines}</ul>
      <p>Skupaj: <strong>${formatEurFromCents(ctx.totalCents)}</strong></p>
      <p>${fulfillment}</p>
      <p>Hvala,<br/>FORTIS Niche Atelier</p>
    `;
  }

  if (template === "ready_for_pickup") {
    return `
      <p>Spoštovani/a ${ctx.fullName},</p>
      <p>naročilo <strong>${ctx.orderNumber}</strong> je pripravljeno za osebni prevzem.</p>
      <p>${ATELIER_ADDRESS_LINE}</p>
      <p>Lep pozdrav,<br/>FORTIS Niche Atelier</p>
    `;
  }

  return `
    <p>Spoštovani/a ${ctx.fullName},</p>
    <p>naročilo <strong>${ctx.orderNumber}</strong> je odposlano.</p>
    ${ctx.trackingUrl ? `<p>Sledenje: <a href="${ctx.trackingUrl}">${ctx.trackingUrl}</a></p>` : ""}
    <p>Lep pozdrav,<br/>FORTIS Niche Atelier</p>
  `;
}

function resolveDeliveryEmail(orderEmail: string): {
  to: string;
  subjectPrefix: string;
} {
  const testTo = getEmailTestRecipient();
  if (testTo) {
    return {
      to: testTo,
      subjectPrefix: `[TEST → ${orderEmail}] `,
    };
  }
  return { to: orderEmail.toLowerCase(), subjectPrefix: "" };
}

export async function enqueueOrderEmail(
  supabase: SupabaseClient,
  template: EmailTemplate,
  ctx: OrderEmailContext
): Promise<{ enqueued: boolean; reason?: string }> {
  const dedupeKey = `${template}:${ctx.orderId}`;
  const delivery = resolveDeliveryEmail(ctx.email);
  const subject =
    delivery.subjectPrefix + buildSubject(template, ctx.orderNumber);

  const { error } = await supabase.from("email_outbox").insert({
    dedupe_key: dedupeKey,
    template,
    to_email: delivery.to,
    subject,
    payload: {
      ...ctx,
      intended_email: ctx.email.toLowerCase(),
      html: buildHtml(template, ctx),
    },
    order_id: ctx.orderId,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return { enqueued: false, reason: "duplicate" };
    }
    console.error("email_outbox insert", error.message);
    return { enqueued: false, reason: error.message };
  }

  return { enqueued: true };
}

async function sendViaResend(row: {
  to_email: string;
  subject: string;
  payload: { html?: string };
}): Promise<{ ok: true; id: string } | { ok: false; error: string; skip?: boolean }> {
  if (!isResendConfigured()) {
    return {
      ok: false,
      skip: true,
      error: "RESEND_API_KEY ni nastavljen — e-pošta ni bila poslana.",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [row.to_email],
      subject: row.subject,
      html: row.payload?.html ?? `<p>${row.subject}</p>`,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };

  if (!res.ok) {
    return {
      ok: false,
      error: json.message ?? `Resend HTTP ${res.status}`,
    };
  }

  return { ok: true, id: json.id ?? "unknown" };
}

/** Process pending/failed outbox rows. Never throws — payment must not roll back. */
export async function processEmailOutbox(
  supabase: SupabaseClient,
  limit = 20
): Promise<{ sent: number; failed: number; skipped: number }> {
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  const { data: rows } = await supabase
    .from("email_outbox")
    .select("id, to_email, subject, payload, attempts, status")
    .in("status", ["pending", "failed"])
    .lte("scheduled_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(limit);

  for (const row of rows ?? []) {
    await supabase
      .from("email_outbox")
      .update({
        status: "sending",
        attempts: (row.attempts ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .in("status", ["pending", "failed"]);

    const result = await sendViaResend({
      to_email: row.to_email,
      subject: row.subject,
      payload: (row.payload ?? {}) as { html?: string },
    });

    if (result.ok) {
      await supabase
        .from("email_outbox")
        .update({
          status: "sent",
          provider_message_id: result.id,
          sent_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      sent += 1;
    } else if (result.skip) {
      await supabase
        .from("email_outbox")
        .update({
          status: "skipped",
          last_error: result.error,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      skipped += 1;
    } else {
      await supabase
        .from("email_outbox")
        .update({
          status: "failed",
          last_error: result.error,
          scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      failed += 1;
    }
  }

  return { sent, failed, skipped };
}
