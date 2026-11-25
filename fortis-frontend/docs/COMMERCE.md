# FORTIS Niche Atelier — commerce setup

## Stack

- Next.js App Router (API routes under `src/app/api`)
- Supabase Auth + PostgreSQL (service role for checkout/inventory/webhooks)
- Stripe Checkout + signed webhooks
- Resend for transactional email (outbox + retry)

Catalogue copy (names, notes, Slovenian UI) stays in `src/data/parfumi.ts`.
Authoritative sellable stock and optional price overrides live in `product_inventory`.

## Migrations

```bash
npm run db:migrate          # 003 → 004 → 005
ONLY=005 npm run db:migrate # when 003/004 already applied
npm run db:seed-inventory   # missing variants → stock_quantity=0 (no overwrite)
npm run test:inventory-flow
```

SQL files:

1. `supabase/migrations/003_perfume_commerce.sql`
2. `supabase/migrations/004_commerce_hardening.sql`
3. `supabase/migrations/005_inventory_rls_hardening.sql`

Do **not** invent production stock. Enter real counts in `/admin/zaloga`, for example:

```sql
insert into public.product_inventory (variant_id, slug, stock_quantity, is_active)
values ('kinetic-aura:100ml', 'kinetic-aura', 3, true)
on conflict (variant_id) do update
set stock_quantity = excluded.stock_quantity, is_active = true;
```

Without an inventory row, checkout refuses the line (never unlimited).

Grant admin access:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

Or set `ADMIN_EMAILS` (bootstrap allowlist).

## Stripe

1. Use **test** keys (`pk_test_` / `sk_test_`) until go-live.
2. Webhook endpoint: `POST /api/webhooks/stripe`
3. Events: `checkout.session.completed`, `checkout.session.expired`,
   `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
   `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Set `STRIPE_WEBHOOK_SECRET` from the Stripe Dashboard (or `stripe listen`).

Success URL is **not** proof of payment — confirmation page polls `/api/orders/status`.

## Email (Resend)

1. Set `RESEND_API_KEY` and `EMAIL_FROM` (verified domain).
2. Messages are written to `email_outbox` (deduped by `dedupe_key`).
3. Cron `/api/cron/commerce` retries failed/pending rows.
4. Missing credentials → rows marked `skipped` (order/payment still succeed).

## Cron

Protect with `CRON_SECRET`:

```
Authorization: Bearer $CRON_SECRET
GET /api/cron/commerce
```

Releases stale inventory reservations and drains the email outbox.

Vercel: configure a Cron Job hitting that path every 15–30 minutes.

## Delivery

Pickup is always available (0 €). Delivery requires `NEXT_PUBLIC_DELIVERY_CENTS`
(and/or admin `store_config`). Address fields are required when delivery is chosen.

Tax rates are **not** invented — `tax_cents` stays 0 until configured separately.

## Local verification

```bash
npm run test:commerce
npm run build
```

Stripe test mode only — never charge live cards from this setup task.
