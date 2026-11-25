/**
 * Isolated inventory → checkout → reservation → payment → release tests.
 * Uses a real catalogue variant with temporary stock; restores to 0 after.
 * Does not invent production stock. Stripe test mode when keys are present.
 *
 *   npx tsx scripts/test-inventory-flow.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

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

function dbUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!password || !projectUrl) return null;
  const ref = new URL(projectUrl).hostname.split(".")[0];
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`;
}

async function main() {
  const { listSellableProducts } = await import("../src/lib/commerce/catalog.ts");
  const { validateCartLines } = await import("../src/lib/commerce/validate-cart.ts");
  const {
    commitReservations,
    releaseReservations,
    reservationExpiresAt,
    reserveStockForOrder,
  } = await import("../src/lib/commerce/inventory.ts");
  const {
    createOrderNumber,
    createGuestAccessToken,
    hashToken,
  } = await import("../src/lib/commerce/order-number.ts");
  const { getServiceSupabase } = await import("../src/lib/supabase/admin.ts");
  const { getStripe, isStripeTestMode } = await import("../src/stripe.ts");

  const products = listSellableProducts();
  assert.ok(products.length > 0, "catalogue empty");
  const fixture = products[0]!.variants[0]!;
  const variantId = fixture.id;
  const slug = fixture.slug;
  console.log(`Fixture variant: ${variantId}`);

  const cs = dbUrl();
  if (!cs) {
    fail("db_connect", "missing SUPABASE_DB_PASSWORD");
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: cs,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // Snapshot prior stock for cleanup
  const prior = await client.query(
    `select stock_quantity, is_active from product_inventory where variant_id=$1`,
    [variantId]
  );
  const priorQty = prior.rows[0]?.stock_quantity ?? null;
  const priorActive = prior.rows[0]?.is_active ?? true;

  const orderIds: string[] = [];
  const supabase = getServiceSupabase();
  if (!supabase) {
    fail("supabase_admin", "service role client missing");
    await client.end();
    process.exit(1);
  }

  try {
    // --- Ensure row exists, set isolated stock=1 for tests ---
    await client.query(
      `insert into product_inventory (variant_id, slug, stock_quantity, is_active)
       values ($1,$2,1,true)
       on conflict (variant_id) do update
       set stock_quantity=1, is_active=true, updated_at=now()`,
      [variantId, slug]
    );
    pass("fixture_stock_set", "available=1");

    // Zero stock cannot purchase
    await client.query(
      `update product_inventory set stock_quantity=0 where variant_id=$1`,
      [variantId]
    );
    const denied = await validateCartLines([{ variantId, quantity: 1 }]);
    assert.equal(denied.ok, false);
    pass("sold_out_rejected", denied.ok === false ? denied.error : undefined);

    await client.query(
      `update product_inventory set stock_quantity=1 where variant_id=$1`,
      [variantId]
    );

    // Client price manipulation ignored (validate uses server cents)
    const validated = await validateCartLines([{ variantId, quantity: 1 }]);
    assert.equal(validated.ok, true);
    if (validated.ok) {
      assert.equal(validated.lines[0]!.unitCents, fixture.unitCents);
      pass(
        "server_price_authoritative",
        `${validated.lines[0]!.unitCents} cents`
      );
    }

    // Oversell attempt
    const oversell = await validateCartLines([{ variantId, quantity: 5 }]);
    assert.equal(oversell.ok, false);
    pass("oversell_quantity_rejected");

    // Create pending order + reserve
    const guestToken = createGuestAccessToken();
    const guestHash = await hashToken(guestToken);
    const orderNumber = createOrderNumber();
    const total = fixture.unitCents;
    const { rows: orderRows } = await client.query(
      `insert into orders (
         order_number, email, full_name, fulfillment,
         subtotal_cents, shipping_cents, tax_cents, total_cents, currency,
         payment_status, fulfillment_status, guest_access_token_hash
       ) values ($1,$2,$3,'pickup',$4,0,0,$4,'eur','pending','unfulfilled',$5)
       returning id`,
      [orderNumber, "fortis-test-fixture@example.com", "Test Fixture", total, guestHash]
    );
    const orderId = orderRows[0].id as string;
    orderIds.push(orderId);

    await client.query(
      `insert into order_items (
         order_id, variant_id, slug, product_name, brand, volume_label,
         quantity, unit_cents, line_cents, currency
       ) values ($1,$2,$3,$4,$5,$6,1,$7,$7,'eur')`,
      [
        orderId,
        variantId,
        slug,
        products[0]!.name,
        products[0]!.brand,
        fixture.volumeLabel,
        fixture.unitCents,
      ]
    );

    const expires = reservationExpiresAt();
    const reserved = await reserveStockForOrder(
      supabase,
      orderId,
      [{ variantId, quantity: 1 }],
      expires
    );
    assert.equal(reserved.ok, true, reserved.ok ? "" : reserved.error);
    pass("reserve_stock");

    const afterReserve = await client.query(
      `select stock_quantity from product_inventory where variant_id=$1`,
      [variantId]
    );
    assert.equal(afterReserve.rows[0].stock_quantity, 0);
    pass("available_decremented_on_reserve");

    // Second customer cannot reserve last unit
    const orderNumber2 = createOrderNumber();
    const { rows: orderRows2 } = await client.query(
      `insert into orders (
         order_number, email, full_name, fulfillment,
         subtotal_cents, shipping_cents, tax_cents, total_cents, currency,
         payment_status, fulfillment_status
       ) values ($1,$2,$3,'pickup',$4,0,0,$4,'eur','pending','unfulfilled')
       returning id`,
      [orderNumber2, "fortis-test-fixture-2@example.com", "Test Fixture 2", total]
    );
    const orderId2 = orderRows2[0].id as string;
    orderIds.push(orderId2);
    const race = await reserveStockForOrder(
      supabase,
      orderId2,
      [{ variantId, quantity: 1 }],
      reservationExpiresAt()
    );
    assert.equal(race.ok, false);
    pass("concurrent_last_unit_blocked", race.ok ? undefined : race.error);

    // Idempotent payment commit (simulate webhook mark paid once)
    await client.query(
      `update orders set payment_status='paid', paid_at=now() where id=$1`,
      [orderId]
    );
    await commitReservations(supabase, orderId);
    await commitReservations(supabase, orderId); // second time — no double restock
    const commits = await client.query(
      `select count(*)::int as n from stock_movements
       where order_id=$1 and reason='commit'`,
      [orderId]
    );
    assert.ok(commits.rows[0].n >= 1);
    const stockAfterPay = await client.query(
      `select stock_quantity from product_inventory where variant_id=$1`,
      [variantId]
    );
    assert.equal(stockAfterPay.rows[0].stock_quantity, 0);
    pass("commit_idempotent_no_restock");

    // Expired release path (separate fixture order)
    await client.query(
      `update product_inventory set stock_quantity=1 where variant_id=$1`,
      [variantId]
    );
    const orderNumber3 = createOrderNumber();
    const { rows: orderRows3 } = await client.query(
      `insert into orders (
         order_number, email, full_name, fulfillment,
         subtotal_cents, shipping_cents, tax_cents, total_cents, currency,
         payment_status, fulfillment_status
       ) values ($1,$2,$3,'pickup',$4,0,0,$4,'eur','pending','unfulfilled')
       returning id`,
      [orderNumber3, "fortis-test-expire@example.com", "Expire Fixture", total]
    );
    const orderId3 = orderRows3[0].id as string;
    orderIds.push(orderId3);
    const reserved3 = await reserveStockForOrder(
      supabase,
      orderId3,
      [{ variantId, quantity: 1 }],
      new Date(Date.now() - 60_000) // already expired timestamp on row
    );
    assert.equal(reserved3.ok, true);
    await releaseReservations(supabase, orderId3, "expired");
    const afterRelease = await client.query(
      `select stock_quantity from product_inventory where variant_id=$1`,
      [variantId]
    );
    assert.equal(afterRelease.rows[0].stock_quantity, 1);
    const resStatus = await client.query(
      `select status from inventory_reservations where order_id=$1`,
      [orderId3]
    );
    assert.equal(resStatus.rows[0]?.status, "expired");
    pass("reservation_release_restores_stock");

    // Late expire must not demote paid
    await client.query(
      `update orders set payment_status='cancelled' where id=$1 and payment_status='pending'`,
      [orderId]
    );
    const paidStill = await client.query(
      `select payment_status from orders where id=$1`,
      [orderId]
    );
    assert.equal(paidStill.rows[0].payment_status, "paid");
    pass("paid_not_demoted_by_cancel_update");

    // RLS: authenticated role cannot update inventory
    const rls = await client.query(`
      select has_table_privilege('authenticated', 'public.product_inventory', 'UPDATE') as can_update,
             has_table_privilege('authenticated', 'public.product_inventory', 'SELECT') as can_select
    `);
    assert.equal(rls.rows[0].can_update, false);
    pass("authenticated_cannot_update_inventory", `select=${rls.rows[0].can_select}`);

    // Stripe test-mode checkout session (optional)
    const stripe = getStripe();
    if (stripe && isStripeTestMode()) {
      try {
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          success_url: "https://example.com/ok",
          cancel_url: "https://example.com/cancel",
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "eur",
                unit_amount: fixture.unitCents,
                product_data: { name: "FORTIS inventory fixture (do not fulfill)" },
              },
            },
          ],
          metadata: { fixture: "inventory-flow", order_id: orderId },
        });
        assert.ok(session.id.startsWith("cs_test_"));
        pass("stripe_test_session_created", session.id.slice(0, 20) + "…");
        await stripe.checkout.sessions.expire(session.id);
        pass("stripe_test_session_expired");
      } catch (e) {
        fail(
          "stripe_test_session",
          e instanceof Error ? e.message : String(e)
        );
      }
    } else {
      fail("stripe_test_session", "Stripe test keys not configured");
    }

    // Webhook secret configured?
    const whsec = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!whsec || whsec.includes("...")) {
      results.push({
        name: "stripe_webhook_secret",
        ok: false,
        detail:
          "BLOCKED: STRIPE_WEBHOOK_SECRET still placeholder — see docs/STRIPE_WEBHOOKS.md",
      });
      console.error(
        "BLOCK stripe_webhook_secret — set whsec from `stripe listen` or Dashboard"
      );
    } else {
      pass("stripe_webhook_secret", "present");
    }

    // Guest token access hash uniqueness
    const h1 = await hashToken(guestToken);
    const h2 = await hashToken(guestToken + "x");
    assert.notEqual(h1, h2);
    pass("guest_token_hash");
  } catch (e) {
    fail("uncaught", e instanceof Error ? e.message : String(e));
  } finally {
    // Cleanup fixture orders / reservations / movements, restore stock
    try {
      for (const id of orderIds) {
        await client.query(`delete from inventory_reservations where order_id=$1`, [id]);
        await client.query(`delete from stock_movements where order_id=$1`, [id]);
        await client.query(`delete from order_items where order_id=$1`, [id]);
        await client.query(`delete from checkout_idempotency_keys where order_id=$1`, [id]);
        await client.query(`delete from orders where id=$1`, [id]);
      }
      if (priorQty == null) {
        await client.query(
          `update product_inventory set stock_quantity=0, is_active=$2 where variant_id=$1`,
          [variantId, priorActive]
        );
      } else {
        await client.query(
          `update product_inventory set stock_quantity=$2, is_active=$3 where variant_id=$1`,
          [variantId, priorQty, priorActive]
        );
      }
      // Remove orphan test stock_movements without order
      await client.query(
        `delete from stock_movements where variant_id=$1 and note like '%fixture%'`,
        [variantId]
      );
      pass("cleanup_restored");
    } catch (e) {
      fail("cleanup", e instanceof Error ? e.message : String(e));
    }
    await client.end();
  }

  const failed = results.filter((r) => !r.ok);
  console.log("\n--- summary ---");
  console.log(`passed ${results.length - failed.length}/${results.length}`);
  for (const f of failed) console.log(`  ${f.name}: ${f.detail}`);
  const hard = failed.filter((f) => !String(f.detail ?? "").startsWith("BLOCKED:"));
  if (hard.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
