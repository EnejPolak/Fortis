import type { SavedOrder } from "@/lib/orders";

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatAddress(order: SavedOrder): string {
  if (order.fulfillment === "pickup") {
    return "Prevzem v atelierju (Poljanska cesta 7, 1000 Ljubljana)";
  }

  const addr = order.shipping_address;
  if (!addr) return "Naslov ni na voljo";

  return [addr.line1, `${addr.postal_code} ${addr.city}`, addr.country]
    .filter(Boolean)
    .join(", ");
}

function buildOrderEmailHtml(order: SavedOrder): string {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<li>${item.wine_name} ${item.wine_vintage} × ${item.quantity} — ${formatMoney(item.line_cents, order.currency)}</li>`
    )
    .join("");

  return `
    <h2>Novo naročilo — Fortis Selection</h2>
    <p><strong>ID:</strong> ${order.id}</p>
    <p><strong>Stripe PI:</strong> ${order.stripe_payment_intent_id}</p>
    <hr />
    <p><strong>Stranka:</strong> ${order.full_name}</p>
    <p><strong>Email:</strong> ${order.email}</p>
    <p><strong>Telefon:</strong> ${order.phone ?? "—"}</p>
    <p><strong>Način:</strong> ${order.fulfillment === "pickup" ? "Prevzem v atelierju" : "Dostava na naslov"}</p>
    <p><strong>Naslov:</strong> ${formatAddress(order)}</p>
    <hr />
    <p><strong>Postavke:</strong></p>
    <ul>${itemsHtml}</ul>
    <p>Vmesna vsota: ${formatMoney(order.subtotal_cents, order.currency)}</p>
    <p>Poštnina: ${order.shipping_cents === 0 ? "Brezplačno" : formatMoney(order.shipping_cents, order.currency)}</p>
    <p><strong>Skupaj: ${formatMoney(order.total_cents, order.currency)}</strong></p>
  `;
}

function buildOrderEmailText(order: SavedOrder): string {
  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.wine_name} ${item.wine_vintage} × ${item.quantity} — ${formatMoney(item.line_cents, order.currency)}`
    )
    .join("\n");

  return [
    "Novo naročilo — Fortis Selection",
    "",
    `ID: ${order.id}`,
    `Stripe PI: ${order.stripe_payment_intent_id}`,
    "",
    `Stranka: ${order.full_name}`,
    `Email: ${order.email}`,
    `Telefon: ${order.phone ?? "—"}`,
    `Način: ${order.fulfillment === "pickup" ? "Prevzem v atelierju" : "Dostava na naslov"}`,
    `Naslov: ${formatAddress(order)}`,
    "",
    "Postavke:",
    itemsText,
    "",
    `Vmesna vsota: ${formatMoney(order.subtotal_cents, order.currency)}`,
    `Poštnina: ${order.shipping_cents === 0 ? "Brezplačno" : formatMoney(order.shipping_cents, order.currency)}`,
    `Skupaj: ${formatMoney(order.total_cents, order.currency)}`,
  ].join("\n");
}

export async function notifyNewOrder(order: SavedOrder): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ORDER_NOTIFY_EMAIL;
  const from =
    process.env.ORDER_NOTIFY_FROM ?? "Fortis <onboarding@resend.dev>";

  if (!apiKey || !to) {
    console.warn(
      "[order-notify] RESEND_API_KEY or ORDER_NOTIFY_EMAIL not set — skipping email"
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Novo naročilo — ${order.full_name} (${formatMoney(order.total_cents, order.currency)})`,
      html: buildOrderEmailHtml(order),
      text: buildOrderEmailText(order),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}
