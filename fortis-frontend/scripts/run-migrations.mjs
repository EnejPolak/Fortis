#!/usr/bin/env node
/**
 * Applies 003 + 004 to Supabase Postgres.
 *
 * Add to .env.local (one of):
 *   SUPABASE_DB_PASSWORD=your-db-password
 *   DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@…pooler.supabase.com:5432/postgres
 *
 * Password: Supabase → Project Settings → Database → Database password
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv(file) {
  const env = {};
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

const env = { ...loadEnv(path.join(root, ".env.local")), ...process.env };

const FILES = [
  "003_perfume_commerce.sql",
  "004_commerce_hardening.sql",
  "005_inventory_rls_hardening.sql",
  "006_admin_allowlist_guard.sql",
];

/** Optional: ONLY=005 npm run db:migrate */
const only = process.env.ONLY?.trim();
const filesToRun = only
  ? FILES.filter((f) => f.startsWith(only) || f.includes(only))
  : FILES;

function candidateUrls() {
  if (env.DATABASE_URL?.trim()) return [env.DATABASE_URL.trim()];

  const password = env.SUPABASE_DB_PASSWORD?.trim();
  const projectUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!password || !projectUrl) return [];

  const ref = new URL(projectUrl).hostname.split(".")[0];
  const encoded = encodeURIComponent(password);
  const regions = [
    "eu-west-1",
    "eu-central-1",
    "eu-west-2",
    "eu-north-1",
    "us-east-1",
    "us-west-1",
    "ap-southeast-1",
  ];

  const urls = [
    `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`,
  ];
  // Prefer aws-1 then aws-0 — newer projects often land on aws-1-*
  for (const prefix of ["aws-1", "aws-0"]) {
    for (const region of regions) {
      urls.push(
        `postgresql://postgres.${ref}:${encoded}@${prefix}-${region}.pooler.supabase.com:5432/postgres`
      );
    }
  }
  return urls;
}

async function connect() {
  const urls = candidateUrls();
  if (!urls.length) {
    console.error(
      "Manjka SUPABASE_DB_PASSWORD ali DATABASE_URL v .env.local.\n" +
        "Dashboard → Project Settings → Database → Database password\n" +
        "Dodaj npr.:\n  SUPABASE_DB_PASSWORD=tvoje-geslo"
    );
    process.exit(1);
  }

  let lastErr;
  for (const connectionString of urls) {
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });
    try {
      await client.connect();
      const host = connectionString.replace(/:[^:@/]+@/, ":****@");
      console.log("Connected:", host);
      return client;
    } catch (err) {
      lastErr = err;
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }
  console.error("Povezava ni uspela:", lastErr?.message ?? lastErr);
  console.error(
    "Preveri geslo. Če je treba, skopiraj Connection string (URI) iz Dashboarda v DATABASE_URL."
  );
  process.exit(1);
}

async function runMigrations(client) {
  if (!filesToRun.length) {
    console.error("No migration files matched ONLY=", only);
    process.exit(1);
  }
  for (const file of filesToRun) {
    const full = path.join(root, "supabase/migrations", file);
    const sql = fs.readFileSync(full, "utf8");
    process.stdout.write(`Running ${file}… `);
    try {
      await client.query(sql);
      console.log("OK");
    } catch (err) {
      console.log("FAIL");
      console.error(err.message);
      process.exit(1);
    }
  }

  const { rows } = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'profiles','orders','order_items','product_inventory',
        'carts','cart_items','email_outbox','inventory_reservations',
        'stock_movements','store_config','checkout_idempotency_keys'
      )
    order by table_name
  `);
  console.log("Tables present:");
  for (const r of rows) console.log(" -", r.table_name);
  if (rows.length < 8) {
    console.error("Pričakovanih tabel je manj — preveri migracije.");
    process.exit(1);
  }

  // Least-privilege grants for PostgREST roles (aligned with 005/006)
  await client.query(`
    grant usage on schema public to postgres, anon, authenticated, service_role;
    grant all on all tables in schema public to postgres, service_role;
    grant all on all sequences in schema public to postgres, service_role;

    revoke all on all tables in schema public from anon, authenticated;

    -- Customer-facing (RLS still applies)
    grant select, insert, update on table public.profiles to authenticated;
    revoke update (is_admin) on table public.profiles from authenticated;
    grant select on table public.orders to authenticated;
    grant select on table public.order_items to authenticated;
    grant select, insert, update, delete on table public.carts to authenticated;
    grant select, insert, update, delete on table public.cart_items to authenticated;
    grant select, insert, update, delete on table public.customer_addresses to authenticated;

    grant usage, select on all sequences in schema public to authenticated;

    revoke execute on all functions in schema public from public, anon, authenticated;
    grant execute on function public.admin_adjust_stock(text, integer, uuid, text) to service_role;
    grant execute on function public.reserve_stock_for_order(uuid, jsonb, timestamptz) to service_role;
    grant execute on function public.commit_reservations_for_order(uuid) to service_role;
    grant execute on function public.release_reservations_for_order(uuid, text) to service_role;
    grant execute on function public.release_stale_reservations(integer) to service_role;

    notify pgrst, 'reload schema';
  `);
  console.log("Grants OK");
  console.log("Done.");
}

const client = await connect();
try {
  await runMigrations(client);
} finally {
  await client.end();
}
