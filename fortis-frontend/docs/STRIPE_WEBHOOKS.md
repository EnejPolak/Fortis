# Stripe webhooks — FORTIS

Endpoint: **`POST /api/webhooks/stripe`**  
(full local URL: `http://localhost:3000/api/webhooks/stripe`)

## Required events

- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

## Local testing (Stripe CLI)

```bash
# Install: https://stripe.com/docs/stripe-cli
stripe login

# Forward test events to the Next.js app (run `npm run dev` in another terminal)
stripe listen \
  --forward-to localhost:3000/api/webhooks/stripe \
  --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,payment_intent.succeeded,payment_intent.payment_failed
```

The CLI prints a **webhook signing secret** (`whsec_…`). Put it only in **server** env:

```bash
# .env.local  (never commit; never NEXT_PUBLIC_*)
STRIPE_WEBHOOK_SECRET=whsec_…   # value from `stripe listen`, not from Dashboard
```

Restart `npm run dev` after changing the secret.

Trigger a real Checkout in the browser with test card `4242 4242 4242 4242`, or:

```bash
stripe trigger checkout.session.completed
```

(Note: generic triggers lack our `metadata.order_id` — prefer a real checkout session created by `/api/checkout/create-session`.)

## Deployment (Vercel / production)

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://www.fortisniche.com/api/webhooks/stripe` (or your deploy host)
3. Select the events listed above
4. Copy the endpoint’s **Signing secret** (`whsec_…`) into the host’s **server** env as `STRIPE_WEBHOOK_SECRET`
5. Use **live** keys only when going live; keep test `whsec_` with `sk_test_` / `pk_test_`

Local CLI secrets and Dashboard endpoint secrets are **different**. Do not reuse one for the other.

## Security

- Signature verified with the **raw** request body (`request.text()` + `constructEvent`)
- Secret stays server-side only
- Processed Stripe `event.id` values are stored uniquely (`processed_stripe_events`)
- Success URL redirect is **not** proof of payment — confirmation page polls `/api/orders/status`
