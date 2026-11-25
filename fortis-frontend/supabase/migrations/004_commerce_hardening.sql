-- Fortis Niche Atelier — commerce hardening
-- Extends 003_perfume_commerce.sql. Non-destructive (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- Catalogue product copy stays in application code; this migration adds inventory authority,
-- carts, reservations, email outbox, checkout idempotency, and admin flags.

-- ---------------------------------------------------------------------------
-- Profiles: admin flag (never assignable by clients — service role / SQL only)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ---------------------------------------------------------------------------
-- Product inventory: price override, SKU, active flag
-- Missing inventory row = not sellable (never treat as unlimited stock).
-- ---------------------------------------------------------------------------
alter table public.product_inventory
  add column if not exists sku text,
  add column if not exists unit_cents integer check (unit_cents is null or unit_cents >= 0),
  add column if not exists is_active boolean not null default true,
  add column if not exists currency text not null default 'eur';

create unique index if not exists product_inventory_sku_uidx
  on public.product_inventory (sku)
  where sku is not null;

-- ---------------------------------------------------------------------------
-- Stock movements (audit trail). Refunds do NOT auto-restock.
-- ---------------------------------------------------------------------------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id text not null references public.product_inventory (variant_id),
  delta integer not null,
  reason text not null check (
    reason in (
      'reserve',
      'release',
      'commit',
      'admin_adjust',
      'restock_explicit',
      'correction'
    )
  ),
  order_id uuid references public.orders (id) on delete set null,
  actor_user_id uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_variant_idx
  on public.stock_movements (variant_id, created_at desc);

create index if not exists stock_movements_order_idx
  on public.stock_movements (order_id);

alter table public.stock_movements enable row level security;
-- service role only

-- ---------------------------------------------------------------------------
-- Inventory reservations (checkout hold until Stripe settles or expires)
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id text not null references public.product_inventory (variant_id),
  quantity integer not null check (quantity > 0),
  status text not null default 'active'
    check (status in ('active', 'committed', 'released', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists inventory_reservations_active_order_variant_uidx
  on public.inventory_reservations (order_id, variant_id)
  where status = 'active';

create index if not exists inventory_reservations_expires_idx
  on public.inventory_reservations (expires_at)
  where status = 'active';

create index if not exists inventory_reservations_order_idx
  on public.inventory_reservations (order_id);

alter table public.inventory_reservations enable row level security;
-- service role only

-- ---------------------------------------------------------------------------
-- Orders: guest token expiry + idempotency key
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists guest_access_token_expires_at timestamptz,
  add column if not exists checkout_idempotency_key text,
  add column if not exists reservation_expires_at timestamptz,
  add column if not exists tax_cents integer not null default 0 check (tax_cents >= 0);

create unique index if not exists orders_checkout_idempotency_uidx
  on public.orders (checkout_idempotency_key)
  where checkout_idempotency_key is not null;

-- Fulfillment statuses already include ready/shipped/delivered/cancelled/unfulfilled.
-- Align "completed" as alias via app layer using delivered.

alter table public.order_items
  add column if not exists sku text,
  add column if not exists currency text not null default 'eur';

-- ---------------------------------------------------------------------------
-- Checkout idempotency ledger (request key → order)
-- ---------------------------------------------------------------------------
create table if not exists public.checkout_idempotency_keys (
  key text primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  stripe_checkout_session_id text,
  created_at timestamptz not null default now()
);

alter table public.checkout_idempotency_keys enable row level security;
-- service role only

-- ---------------------------------------------------------------------------
-- Carts (authenticated persistence). Guests keep localStorage + optional sync.
-- ---------------------------------------------------------------------------
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id text not null,
  slug text not null,
  quantity integer not null check (quantity > 0 and quantity <= 20),
  unique (cart_id, variant_id)
);

create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

create policy "carts_select_own"
  on public.carts for select
  using (auth.uid() = user_id);

create policy "carts_insert_own"
  on public.carts for insert
  with check (auth.uid() = user_id);

create policy "carts_update_own"
  on public.carts for update
  using (auth.uid() = user_id);

create policy "carts_delete_own"
  on public.carts for delete
  using (auth.uid() = user_id);

create policy "cart_items_select_own"
  on public.cart_items for select
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  );

create policy "cart_items_insert_own"
  on public.cart_items for insert
  with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  );

create policy "cart_items_update_own"
  on public.cart_items for update
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  );

create policy "cart_items_delete_own"
  on public.cart_items for delete
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Email outbox (retryable, deduplicated)
-- ---------------------------------------------------------------------------
create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  template text not null,
  to_email text not null,
  subject text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  last_error text,
  provider_message_id text,
  order_id uuid references public.orders (id) on delete set null,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_outbox_pending_idx
  on public.email_outbox (status, scheduled_at)
  where status in ('pending', 'failed');

alter table public.email_outbox enable row level security;
-- service role only

-- ---------------------------------------------------------------------------
-- Fulfillment / store config (pickup address, delivery cents)
-- ---------------------------------------------------------------------------
create table if not exists public.store_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.store_config enable row level security;
-- service role only; app may expose public read via API for non-secret keys

insert into public.store_config (key, value)
values
  (
    'fulfillment',
    jsonb_build_object(
      'pickup',
      jsonb_build_object(
        'enabled', true,
        'cents', 0,
        'label', 'Osebni prevzem',
        'address', 'Ljubljana — Niche Atelier (podrobnosti ob naročilu)'
      ),
      'delivery',
      jsonb_build_object(
        'enabled', false,
        'cents', null,
        'label', 'Dostava',
        'requires_address', true
      ),
      'tax',
      jsonb_build_object(
        'mode', 'included_or_not_configured',
        'note', 'Davčna stopnja ni konfigurirana v aplikaciji; zneski so prikazani kot v katalogu (EUR minor units).'
      )
    )
  )
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Atomic inventory helpers (service role / SECURITY DEFINER)
-- ---------------------------------------------------------------------------
create or replace function public.reserve_stock_for_order(
  p_order_id uuid,
  p_items jsonb,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  available integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ITEMS';
  end if;

  -- Lock inventory rows in stable order to avoid deadlocks
  for item in
    select
      (e->>'variant_id')::text as variant_id,
      (e->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items) e
    order by 1
  loop
    if item.variant_id is null or item.quantity is null or item.quantity <= 0 then
      raise exception 'INVALID_ITEM';
    end if;

    select stock_quantity into available
    from public.product_inventory
    where variant_id = item.variant_id
      and is_active = true
    for update;

    if not found then
      raise exception 'NO_INVENTORY:%', item.variant_id;
    end if;

    if available < item.quantity then
      raise exception 'INSUFFICIENT_STOCK:%:%:%', item.variant_id, available, item.quantity;
    end if;

    update public.product_inventory
    set stock_quantity = stock_quantity - item.quantity,
        updated_at = now()
    where variant_id = item.variant_id;

    insert into public.inventory_reservations (
      order_id, variant_id, quantity, status, expires_at
    ) values (
      p_order_id, item.variant_id, item.quantity, 'active', p_expires_at
    );

    insert into public.stock_movements (
      variant_id, delta, reason, order_id, note
    ) values (
      item.variant_id, -item.quantity, 'reserve', p_order_id, 'checkout reservation'
    );
  end loop;

  update public.orders
  set reservation_expires_at = p_expires_at,
      updated_at = now()
  where id = p_order_id;
end;
$$;

create or replace function public.commit_reservations_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inventory_reservations
  set status = 'committed',
      updated_at = now()
  where order_id = p_order_id
    and status = 'active';

  -- Stock already decremented at reserve time; log commit markers (idempotent callers)
  insert into public.stock_movements (variant_id, delta, reason, order_id, note)
  select r.variant_id, 0, 'commit', p_order_id, 'payment confirmed'
  from public.inventory_reservations r
  where r.order_id = p_order_id
    and r.status = 'committed'
    and not exists (
      select 1 from public.stock_movements m
      where m.order_id = p_order_id
        and m.variant_id = r.variant_id
        and m.reason = 'commit'
    );
end;
$$;

create or replace function public.release_reservations_for_order(
  p_order_id uuid,
  p_reason text default 'release'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  new_status text;
begin
  new_status := case when p_reason = 'expired' then 'expired' else 'released' end;

  for rec in
    select id, variant_id, quantity
    from public.inventory_reservations
    where order_id = p_order_id
      and status = 'active'
    for update
  loop
    update public.product_inventory
    set stock_quantity = stock_quantity + rec.quantity,
        updated_at = now()
    where variant_id = rec.variant_id;

    update public.inventory_reservations
    set status = new_status,
        updated_at = now()
    where id = rec.id;

    insert into public.stock_movements (
      variant_id, delta, reason, order_id, note
    ) values (
      rec.variant_id,
      rec.quantity,
      case when p_reason = 'expired' then 'release' else 'release' end,
      p_order_id,
      p_reason
    );
  end loop;
end;
$$;

create or replace function public.release_stale_reservations(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  oid uuid;
  n integer := 0;
begin
  for oid in
    select distinct order_id
    from public.inventory_reservations
    where status = 'active'
      and expires_at < now()
    limit p_limit
  loop
    -- Do not release if order already paid (race with webhook)
    if exists (
      select 1 from public.orders o
      where o.id = oid and o.payment_status = 'paid'
    ) then
      perform public.commit_reservations_for_order(oid);
    else
      perform public.release_reservations_for_order(oid, 'expired');
      update public.orders
      set payment_status = case
            when payment_status = 'pending' then 'cancelled'
            else payment_status
          end,
          updated_at = now()
      where id = oid
        and payment_status = 'pending';
    end if;
    n := n + 1;
  end loop;
  return n;
end;
$$;

create or replace function public.admin_adjust_stock(
  p_variant_id text,
  p_new_quantity integer,
  p_actor uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_qty integer;
  delta integer;
begin
  if p_new_quantity < 0 then
    raise exception 'NEGATIVE_STOCK';
  end if;

  if not exists (
    select 1 from public.profiles where id = p_actor and is_admin = true
  ) then
    raise exception 'NOT_ADMIN';
  end if;

  select stock_quantity into current_qty
  from public.product_inventory
  where variant_id = p_variant_id
  for update;

  if not found then
    raise exception 'NO_INVENTORY';
  end if;

  delta := p_new_quantity - current_qty;

  update public.product_inventory
  set stock_quantity = p_new_quantity,
      updated_at = now()
  where variant_id = p_variant_id;

  insert into public.stock_movements (
    variant_id, delta, reason, actor_user_id, note
  ) values (
    p_variant_id, delta, 'admin_adjust', p_actor, coalesce(p_note, 'admin stock adjust')
  );
end;
$$;

revoke all on function public.reserve_stock_for_order(uuid, jsonb, timestamptz) from public;
revoke all on function public.commit_reservations_for_order(uuid) from public;
revoke all on function public.release_reservations_for_order(uuid, text) from public;
revoke all on function public.release_stale_reservations(integer) from public;
revoke all on function public.admin_adjust_stock(text, integer, uuid, text) from public;

grant execute on function public.reserve_stock_for_order(uuid, jsonb, timestamptz) to service_role;
grant execute on function public.commit_reservations_for_order(uuid) to service_role;
grant execute on function public.release_reservations_for_order(uuid, text) to service_role;
grant execute on function public.release_stale_reservations(integer) to service_role;
grant execute on function public.admin_adjust_stock(text, integer, uuid, text) to service_role;
