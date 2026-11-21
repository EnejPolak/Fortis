  -- Fortis wine inventory
  -- Run in Supabase Dashboard → SQL Editor (after 001_orders.sql)

  create table if not exists public.wine_inventory (
    wine_slug text primary key,
    stock_quantity integer not null default 0 check (stock_quantity >= 0),
    updated_at timestamptz not null default now()
  );

  insert into public.wine_inventory (wine_slug, stock_quantity)
  values ('primo', 24)
  on conflict (wine_slug) do nothing;

  alter table public.wine_inventory enable row level security;

  -- No public policies: reads/writes go through service role in API routes.
