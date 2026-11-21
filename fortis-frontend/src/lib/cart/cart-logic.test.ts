import assert from "node:assert/strict";
import {
  addLine,
  cartItemCount,
  emptyCart,
  mergeCartLines,
  setLineQuantity,
} from "@/lib/cart/cart-logic";

function run() {
  let cart = emptyCart();
  const variantA = "kinetic-aura:100ml";
  const variantB = "kinetic-kayu:100ml";

  let result = addLine(cart, variantA, 1);
  assert.equal(result.error, undefined);
  cart = result.state;
  assert.equal(cartItemCount(cart), 1);

  result = addLine(cart, variantA, 2);
  assert.equal(result.error, undefined);
  cart = result.state;
  assert.equal(cart.lines[0]?.quantity, 3);

  result = addLine(cart, variantB, 1);
  cart = result.state;
  assert.equal(cart.lines.length, 2);

  result = setLineQuantity(cart, variantA, 1);
  cart = result.state;
  assert.equal(cart.lines.find((l) => l.variantId === variantA)?.quantity, 1);

  const merged = mergeCartLines(cart.lines, [
    { variantId: variantA, slug: "kinetic-aura", quantity: 2 },
  ]);
  assert.equal(
    merged.find((l) => l.variantId === variantA)?.quantity,
    3
  );

  console.log("cart-logic.test.ts: ok");
}

run();
