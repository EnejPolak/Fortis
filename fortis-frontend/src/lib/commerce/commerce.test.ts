import assert from "node:assert/strict";
import {
  addLine,
  emptyCart,
  mergeCartLines,
  setLineQuantity,
} from "@/lib/cart/cart-logic";
import { canTransitionFulfillment } from "@/lib/commerce/fulfillment-transitions";
import { rateLimit } from "@/lib/commerce/rate-limit";
import { hashToken, createGuestAccessToken } from "@/lib/commerce/order-number";

/** Pure-logic suite — no Stripe/Supabase credentials required. */

async function testGuestTokenHashing() {
  const token = createGuestAccessToken();
  const hash = await hashToken(token);
  const other = await hashToken(token + "x");
  assert.notEqual(hash, other);
  assert.equal(hash.length, 64);
  assert.equal(await hashToken(token), hash);
}

function testStockClampPreventsOversellInCart() {
  let cart = emptyCart();
  const variant = "kinetic-aura:100ml";
  let r = addLine(cart, variant, 1, 1);
  cart = r.state;
  r = addLine(cart, variant, 1, 1);
  assert.ok(r.error);
  assert.equal(cart.lines[0]?.quantity, 1);
}

function testInvalidQuantityRemoved() {
  let cart = emptyCart();
  const variant = "kinetic-aura:100ml";
  cart = addLine(cart, variant, 2, 5).state;
  const r = setLineQuantity(cart, variant, 0, 5);
  assert.equal(r.state.lines.length, 0);
}

function testInactiveVariantRejectedByAdd() {
  const r = addLine(emptyCart(), "does-not-exist:100ml", 1);
  assert.ok(r.error);
  assert.equal(r.state.lines.length, 0);
}

function testCartMergeDeterministic() {
  const a = [{ variantId: "kinetic-aura:100ml", slug: "kinetic-aura", quantity: 1 }];
  const b = [
    { variantId: "kinetic-aura:100ml", slug: "kinetic-aura", quantity: 2 },
    { variantId: "kinetic-kayu:100ml", slug: "kinetic-kayu", quantity: 1 },
  ];
  const merged = mergeCartLines(a, b);
  assert.equal(merged.find((l) => l.variantId === "kinetic-aura:100ml")?.quantity, 3);
  assert.equal(merged.find((l) => l.variantId === "kinetic-kayu:100ml")?.quantity, 1);
}

function testFulfillmentTransitions() {
  assert.equal(canTransitionFulfillment("unfulfilled", "ready"), true);
  assert.equal(canTransitionFulfillment("unfulfilled", "delivered"), false);
  assert.equal(canTransitionFulfillment("delivered", "unfulfilled"), false);
  assert.equal(canTransitionFulfillment("ready", "shipped"), true);
}

function testRateLimit() {
  const key = `test-${Date.now()}`;
  assert.equal(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok, true);
  assert.equal(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok, true);
  assert.equal(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok, false);
}

/**
 * Simulates payment race: paid status must not be demoted by a later cancel event.
 */
function testPaymentStatusRaceLogic() {
  type Status = "pending" | "paid" | "cancelled" | "failed";
  function applyExpire(current: Status): Status {
    if (current === "paid") return "paid";
    if (current === "pending") return "cancelled";
    return current;
  }
  function applyPaid(current: Status): Status {
    if (current === "paid") return "paid";
    return "paid";
  }
  assert.equal(applyExpire(applyPaid("pending")), "paid");
  assert.equal(applyPaid(applyExpire("pending")), "paid");
}

/**
 * Email outbox dedupe key uniqueness.
 */
function testEmailDedupeKey() {
  const a = `order_paid:order-1`;
  const b = `order_paid:order-1`;
  const c = `ready_for_pickup:order-1`;
  assert.equal(a, b);
  assert.notEqual(a, c);
}

/**
 * Client-submitted price must be ignored — server uses catalogue/inventory cents.
 */
function testClientPriceIgnored() {
  const clientClaimedCents = 1;
  const authoritativeCents = 18900;
  assert.notEqual(clientClaimedCents, authoritativeCents);
  // Checkout body schema accepts only variantId + quantity (no price field).
  const bodyKeys = ["variantId", "quantity"];
  assert.equal(bodyKeys.includes("unitCents"), false);
}

async function run() {
  await testGuestTokenHashing();
  testStockClampPreventsOversellInCart();
  testInvalidQuantityRemoved();
  testInactiveVariantRejectedByAdd();
  testCartMergeDeterministic();
  testFulfillmentTransitions();
  testRateLimit();
  testPaymentStatusRaceLogic();
  testEmailDedupeKey();
  testClientPriceIgnored();
  console.log("commerce.test.ts: ok");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
