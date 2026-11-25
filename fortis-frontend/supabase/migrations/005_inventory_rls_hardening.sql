-- Harden inventory / order privileges: customers must not mutate inventory
-- or read others' orders. Service role continues to bypass RLS.

-- Explicit revoke of broad table grants from public client roles
revoke all on table public.product_inventory from anon, authenticated;
revoke all on table public.stock_movements from anon, authenticated;
revoke all on table public.inventory_reservations from anon, authenticated;
revoke all on table public.email_outbox from anon, authenticated;
revoke all on table public.checkout_idempotency_keys from anon, authenticated;
revoke all on table public.processed_stripe_events from anon, authenticated;
revoke all on table public.store_config from anon, authenticated;

-- Orders: authenticated may only SELECT own (policy already exists); no writes
revoke insert, update, delete, truncate, references, trigger
  on table public.orders from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.order_items from anon, authenticated;
grant select on table public.orders to authenticated;
grant select on table public.order_items to authenticated;

-- Profiles: own row only via existing policies
revoke all on table public.profiles from anon;
grant select, update, insert on table public.profiles to authenticated;

-- Ensure RLS remains on (idempotent)
alter table public.product_inventory enable row level security;
alter table public.stock_movements enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.email_outbox enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- No SELECT/WRITE policies on product_inventory for authenticated/anon:
-- only service_role (bypass) and postgres. Intentionally empty.

-- Block authenticated from calling admin stock RPC
revoke execute on function public.admin_adjust_stock(text, integer, uuid, text) from public, anon, authenticated;
revoke execute on function public.reserve_stock_for_order(uuid, jsonb, timestamptz) from public, anon, authenticated;
revoke execute on function public.commit_reservations_for_order(uuid) from public, anon, authenticated;
revoke execute on function public.release_reservations_for_order(uuid, text) from public, anon, authenticated;
revoke execute on function public.release_stale_reservations(integer) from public, anon, authenticated;

grant execute on function public.admin_adjust_stock(text, integer, uuid, text) to service_role;
grant execute on function public.reserve_stock_for_order(uuid, jsonb, timestamptz) to service_role;
grant execute on function public.commit_reservations_for_order(uuid) to service_role;
grant execute on function public.release_reservations_for_order(uuid, text) to service_role;
grant execute on function public.release_stale_reservations(integer) to service_role;

notify pgrst, 'reload schema';
