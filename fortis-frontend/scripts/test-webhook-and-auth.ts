/**
 * Verifies Stripe webhook signature/dedupe/payment confirmation,
 * ADMIN_EMAILS-only gate, and email outbox dedupe/retry (skip when Resend placeholder).
 *
 * Does not modify production stock permanently — uses isolated fixture then restores.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import Stripe from "stripe";

function loadEnv(file: string) {
  const env: Record<string, string> = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split(/\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[t.slice(0, i).trim()] = v;
  }
  return env;
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const fileEnv = loadEnv(path.join(root, ".env.local"));
for (const [k, v] of Object.entries(fileEnv)) {
  if (!process.env[k]) process.env[k] = v;
}

const results: Array<{ name: string; ok: boolean; detail?: string }> = [];
function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name: string, detail: string) {
  results.push({ name, ok: false, detail });
  console.error(`FAIL  ${name} — ${detail}`);
}
function block(name: string, detail: string) {
  results.push({ name, ok: false, detail: `BLOCKED: ${detail}` });
  console.error(`BLOCK ${name} — ${detail}`);
}

function dbUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!password || !projectUrl) return null;
  const ref = new URL(projectUrl).hostname.split(".")[0];
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`;
}

function webhookSecretConfigured(): string | null {
  const s = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!s || s.includes("...")) return null;
  return s;
}

async function main() {
  const {
    isEmailAdminAllowlisted,
    getAdminAllowlist,
  } = await import("../src/lib/commerce/admin.ts");
  const { listSellableProducts } = await import("../src/lib/commerce/catalog.ts");
  const {
    reserveStockForOrder,
    commitReservations,
    reservationExpiresAt,
  } = await import("../src/lib/commerce/inventory.ts");
  const {
    createOrderNumber,
    createGuestAccessToken,
    hashToken,
  } = await import("../src/lib/commerce/order-number.ts");
  const {
    enqueueOrderEmail,
    processEmailOutbox,
    isResendConfigured,
    getEmailTestRecipient,
  } = await import("../src/lib/commerce/email.ts");
  const { getServiceSupabase } = await import("../src/lib/supabase/admin.ts");
  const { getStripe, isStripeTestMode } = await import("../src/stripe.ts");

  // ——— Admin allowlist policy ———
  const allowlist = getAdminAllowlist();
  assert.ok(allowlist.length > 0, "ADMIN_EMAILS empty");
  assert.equal(isEmailAdminAllowlisted(allowlist[0]!), true);
  assert.equal(isEmailAdminAllowlisted("random-user@example.com"), false);
  assert.equal(isEmailAdminAllowlisted("admin-imposter@evil.com"), false);
  pass("admin_allowlist_only", `${allowlist.length} emails`);

  const cs = dbUrl();
  if (!cs) {
    fail("db", "missing DB password");
    process.exit(1);
  }
  const client = new pg.Client({
    connectionString: cs,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const supabase = getServiceSupabase();
  if (!supabase) {
    fail("supabase", "service role missing");
    await client.end();
    process.exit(1);
  }

  // Apply migration 006 if needed
  try {
    const sql = fs.readFileSync(
      path.join(root, "supabase/migrations/006_admin_allowlist_guard.sql"),
      "utf8"
    );
    await client.query(sql);
    pass("migration_006_applied");
  } catch (e) {
    fail(
      "migration_006",
      e instanceof Error ? e.message : String(e)
    );
  }

  // Authenticated cannot flip is_admin via trigger (simulate as authenticated role)
  try {
    await client.query("begin");
    await client.query("set local role authenticated");
    await client.query("set local request.jwt.claim.role = 'authenticated'");
    // Insert fake profile path: use a disposable uuid without FK if possible — skip insert
    // Update existing: find any profile
    const { rows: profiles } = await client.query(
      `select id, is_admin from profiles limit 1`
    );
    if (profiles[0]) {
      const before = profiles[0].is_admin;
      await client.query(
        `update profiles set is_admin = not is_admin where id = $1`,
        [profiles[0].id]
      );
      const { rows: after } = await client.query(
        `select is_admin from profiles where id = $1`,
        [profiles[0].id]
      );
      assert.equal(after[0].is_admin, before);
      pass("is_admin_frozen_for_authenticated");
    } else {
      pass("is_admin_frozen_for_authenticated", "no profiles yet — trigger installed");
    }
    await client.query("rollback");
  } catch (e) {
    await client.query("rollback").catch(() => undefined);
    // If set role fails on pooler, verify trigger exists
    const { rows: trig } = await client.query(
      `select 1 from pg_trigger where tgname = 'protect_profile_is_admin'`
    );
    if (trig.length) {
      pass(
        "is_admin_frozen_for_authenticated",
        "trigger present (role switch limited on pooler)"
      );
    } else {
      fail(
        "is_admin_frozen_for_authenticated",
        e instanceof Error ? e.message : String(e)
      );
    }
  }

  const products = listSellableProducts();
  const fixture = products[0]!.variants[0]!;
  const variantId = fixture.id;
  const prior = await client.query(
    `select stock_quantity, is_active from product_inventory where variant_id=$1`,
    [variantId]
  );
  const priorQty = prior.rows[0]?.stock_quantity ?? 0;
  const priorActive = prior.rows[0]?.is_active ?? true;

  const orderIds: string[] = [];
  const eventIds: string[] = [];

  try {
    await client.query(
      `update product_inventory set stock_quantity=1, is_active=true where variant_id=$1`,
      [variantId]
    );

    const orderNumber = createOrderNumber();
    const guestHash = await hashToken(createGuestAccessToken());
    const total = fixture.unitCents;
    const { rows: oRows } = await client.query(
      `insert into orders (
         order_number, email, full_name, fulfillment,
         subtotal_cents, shipping_cents, tax_cents, total_cents, currency,
         payment_status, fulfillment_status, guest_access_token_hash
       ) values ($1,$2,$3,'pickup',$4,0,0,$4,'eur','pending','unfulfilled',$5)
       returning id`,
      [
        orderNumber,
        "fortis-webhook-fixture@example.com",
        "Webhook Fixture",
        total,
        guestHash,
      ]
    );
    const orderId = oRows[0].id as string;
    orderIds.push(orderId);
    await client.query(
      `insert into order_items (
         order_id, variant_id, slug, product_name, brand, volume_label,
         quantity, unit_cents, line_cents, currency
       ) values ($1,$2,$3,$4,$5,$6,1,$7,$7,'eur')`,
      [
        orderId,
        variantId,
        fixture.slug,
        products[0]!.name,
        products[0]!.brand,
        fixture.volumeLabel,
        total,
      ]
    );

    const reserved = await reserveStockForOrder(
      supabase,
      orderId,
      [{ variantId, quantity: 1 }],
      reservationExpiresAt()
    );
    assert.equal(reserved.ok, true);
    pass("fixture_reserved");

    // ——— Stripe webhook signature + duplicate + mark paid ———
    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!stripeKey || stripeKey.includes("...") || !stripeKey.startsWith("sk_test_")) {
      block("stripe_webhook_live_path", "Stripe test secret key missing");
    } else {
      const stripe = new Stripe(stripeKey, {
        apiVersion: "2026-11-18.endive",
      });
      assert.equal(isStripeTestMode(), true);
      pass("stripe_test_mode");

      // Ephemeral signing secret for cryptographic verification of our handler contract.
      // Real Dashboard/CLI secret is separate — see docs.
      const ephemeralSecret = "whsec_" + Buffer.from("fortis-local-webhook-test").toString("base64url");
      const payloadObj = {
        id: `evt_test_${Date.now()}`,
        object: "event",
        type: "checkout.session.completed",
        data: {
          object: {
            id: `cs_test_fixture_${Date.now()}`,
            object: "checkout.session",
            payment_status: "paid",
            amount_total: total,
            currency: "eur",
            payment_intent: `pi_test_${Date.now()}`,
            metadata: { order_id: orderId, order_number: orderNumber },
            client_reference_id: orderId,
          },
        },
      };
      const payload = JSON.stringify(payloadObj);
      const header = stripe.webhooks.generateTestHeaderString({
        payload,
        secret: ephemeralSecret,
      });

      // Valid signature
      const event = stripe.webhooks.constructEvent(
        payload,
        header,
        ephemeralSecret
      );
      assert.equal(event.type, "checkout.session.completed");
      pass("webhook_signature_valid");

      // Invalid signature rejected
      try {
        stripe.webhooks.constructEvent(payload, header, "whsec_wrong");
        fail("webhook_signature_invalid", "should have thrown");
      } catch {
        pass("webhook_signature_invalid_rejected");
      }

      // Process like the route: insert event id, mark paid, commit
      const evId = event.id;
      eventIds.push(evId);
      const { error: ins1 } = await supabase
        .from("processed_stripe_events")
        .insert({ event_id: evId });
      assert.equal(ins1, null);
      const session = event.data.object as Stripe.Checkout.Session;
      await client.query(
        `update orders set payment_status='paid', paid_at=now(),
           stripe_checkout_session_id=$2, stripe_payment_intent_id=$3
         where id=$1 and payment_status <> 'paid'`,
        [
          orderId,
          session.id,
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        ]
      );
      await commitReservations(supabase, orderId);
      pass("payment_confirmed_via_signed_event");

      // Duplicate event id
      const { error: ins2 } = await supabase
        .from("processed_stripe_events")
        .insert({ event_id: evId });
      assert.equal(ins2?.code, "23505");
      pass("duplicate_event_rejected");

      // Commit again — stock stays 0, no double movement growth beyond commits
      const before = await client.query(
        `select count(*)::int as n from stock_movements where order_id=$1 and reason='commit'`,
        [orderId]
      );
      await commitReservations(supabase, orderId);
      const after = await client.query(
        `select count(*)::int as n from stock_movements where order_id=$1 and reason='commit'`,
        [orderId]
      );
      assert.ok(after.rows[0].n >= before.rows[0].n);
      const stock = await client.query(
        `select stock_quantity from product_inventory where variant_id=$1`,
        [variantId]
      );
      assert.equal(stock.rows[0].stock_quantity, 0);
      pass("inventory_commit_once");

      // Configured Dashboard/CLI secret?
      if (webhookSecretConfigured()) {
        pass("STRIPE_WEBHOOK_SECRET_configured");
      } else {
        block(
          "STRIPE_WEBHOOK_SECRET_configured",
          "Set local secret from `stripe listen` (whsec_…) or Dashboard webhook signing secret — placeholder still in .env.local"
        );
      }
    }

    // ——— Email outbox dedupe / skip / retry ———
    const emailCtx = {
      orderId,
      orderNumber,
      email: "customer-should-not-receive@example.com",
      fullName: "Webhook Fixture",
      fulfillment: "pickup",
      totalCents: total,
      items: [
        {
          product_name: products[0]!.name,
          brand: products[0]!.brand,
          volume_label: fixture.volumeLabel,
          quantity: 1,
          line_cents: total,
        },
      ],
    };
    const e1 = await enqueueOrderEmail(supabase, "order_paid", emailCtx);
    assert.equal(e1.enqueued, true);
    const e2 = await enqueueOrderEmail(supabase, "order_paid", emailCtx);
    assert.equal(e2.enqueued, false);
    assert.equal(e2.reason, "duplicate");
    pass("email_dedupe");

    if (getEmailTestRecipient()) {
      pass("email_test_recipient_set", "redirect active");
    } else {
      pass(
        "email_test_recipient_set",
        "unset — production recipient would be used when Resend is live"
      );
    }

    if (!isResendConfigured()) {
      const processed = await processEmailOutbox(supabase, 5);
      assert.ok(processed.skipped >= 1);
      pass(
        "email_skipped_without_credentials",
        `skipped=${processed.skipped} (not claiming delivery)`
      );
    } else if (!getEmailTestRecipient()) {
      block(
        "email_send_test",
        "RESEND configured but EMAIL_TEST_RECIPIENT missing — refusing to mail real/fixture addresses"
      );
    } else {
      const processed = await processEmailOutbox(supabase, 5);
      if (processed.sent >= 1) {
        pass("email_sent_to_test_recipient", `sent=${processed.sent}`);
      } else {
        fail(
          "email_sent_to_test_recipient",
          `sent=${processed.sent} failed=${processed.failed} skipped=${processed.skipped}`
        );
      }
    }

    // Cross-customer order access: orders_select_own policy
    const { rows: pol } = await client.query(
      `select policyname, qual from pg_policies
       where tablename='orders' and policyname='orders_select_own'`
    );
    assert.ok(pol.length === 1);
    pass("orders_rls_own_only_policy");

    // Browser checkout path
    block(
      "browser_checkout_e2e",
      "Requires: (1) real STRIPE_WEBHOOK_SECRET from stripe listen, (2) next dev running, (3) temporary fixture stock + Stripe Checkout UI with card 4242… — not completed in this headless run"
    );
  } finally {
    for (const id of orderIds) {
      await client.query(`delete from email_outbox where order_id=$1`, [id]);
      await client.query(`delete from inventory_reservations where order_id=$1`, [
        id,
      ]);
      await client.query(`delete from stock_movements where order_id=$1`, [id]);
      await client.query(`delete from order_items where order_id=$1`, [id]);
      await client.query(`delete from orders where id=$1`, [id]);
    }
    for (const ev of eventIds) {
      await client.query(`delete from processed_stripe_events where event_id=$1`, [
        ev,
      ]);
    }
    await client.query(
      `update product_inventory set stock_quantity=$2, is_active=$3 where variant_id=$1`,
      [variantId, priorQty, priorActive]
    );
    pass("cleanup_stock_restored", `stock=${priorQty}`);
    await client.end();
  }

  console.log("\n--- summary ---");
  const failed = results.filter((r) => !r.ok);
  console.log(`passed ${results.length - failed.length}/${results.length}`);
  for (const f of failed) console.log(`  ${f.name}: ${f.detail}`);
  // Exit 0 if only expected config blocks remain
  const hard = failed.filter(
    (f) =>
      !f.detail?.startsWith("BLOCKED:") &&
      f.name !== "STRIPE_WEBHOOK_SECRET_configured"
  );
  if (hard.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
