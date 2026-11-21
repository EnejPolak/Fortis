-- Fortis Niche Atelier — perfume commerce schema
-- Run in Supabase SQL Editor after reviewing.
-- Replaces wine-oriented 001/002 for new installs; safe to run alongside them
-- (different table names). Do not treat seed stock as production inventory.

create extension if not exists pgcrypto;

-- Customer profile (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text,
  full_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  postal_code text not null,
  country text not null default 'SI',
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_addresses_user_id_idx
  on public.customer_addresses (user_id);

alter table public.customer_addresses enable row level security;

create policy "addresses_select_own"
  on public.customer_addresses for select
  using (auth.uid() = user_id);

create policy "addresses_insert_own"
  on public.customer_addresses for insert
  with check (auth.uid() = user_id);

create policy "addresses_update_own"
  on public.customer_addresses for update
  using (auth.uid() = user_id);

create policy "addresses_delete_own"
  on public.customer_addresses for delete
  using (auth.uid() = user_id);

-- Inventory by catalogue variant id (`slug:volumeKey`)
create table if not exists public.product_inventory (
  variant_id text primary key,
  slug text not null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists product_inventory_slug_idx
  on public.product_inventory (slug);

alter table public.product_inventory enable row level security;
-- No public policies: service role only.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  full_name text not null,
  phone text,
  fulfillment text not null check (fulfillment in ('pickup', 'delivery')),
  shipping_address jsonb,
  billing_address jsonb,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'eur',
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'cancelled')),
  fulfillment_status text not null default 'unfulfilled'
    check (fulfillment_status in ('unfulfilled', 'ready', 'shipped', 'delivered', 'cancelled')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  guest_access_token_hash text,
  tracking_url text,
  notes text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_email_idx on public.orders (email);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;

create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id text not null,
  slug text not null,
  product_name text not null,
  brand text not null,
  volume_label text not null,
  image_src text,
  quantity integer not null check (quantity > 0),
  unit_cents integer not null check (unit_cents >= 0),
  line_cents integer not null check (line_cents >= 0)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

create policy "order_items_select_own"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- Idempotent webhook / event processing
create table if not exists public.processed_stripe_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

alter table public.processed_stripe_events enable row level security;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- TEMPORARY seed stock for development/test only.
-- Replace with real atelier counts before production.
-- Uncomment after confirming variant_ids from the catalogue.
-- insert into public.product_inventory (variant_id, slug, stock_quantity)
-- values
--   ('kinetic-aura:100ml', 'kinetic-aura', 5)
-- on conflict (variant_id) do nothing;
