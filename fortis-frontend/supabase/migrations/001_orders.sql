-- Fortis orders schema
-- Run in Supabase Dashboard → SQL Editor

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_payment_intent_id text not null unique,
  email text not null,
  full_name text not null,
  phone text,
  fulfillment text not null check (fulfillment in ('pickup', 'delivery')),
  shipping_address jsonb,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'eur',
  status text not null default 'paid' check (status in ('paid', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  wine_slug text not null,
  wine_name text not null,
  wine_vintage text not null,
  quantity integer not null check (quantity > 0),
  unit_cents integer not null check (unit_cents >= 0),
  line_cents integer not null check (line_cents >= 0)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- No public policies: writes go through service role key only.
