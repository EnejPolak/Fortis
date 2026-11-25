/**
 * Ensures every sellable catalogue variant has a product_inventory row at stock=0.
 * Does not overwrite existing stock or is_active.
 *
 *   npx tsx scripts/seed-inventory-zero.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { listSellableProducts } from "../src/lib/commerce/catalog";

function loadEnv(file: string) {
  const env: Record<string, string> = {};
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

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...loadEnv(path.join(root, ".env.local")), ...process.env };

const variants = listSellableProducts().flatMap((p) =>
  p.variants.map((v) => ({
    variant_id: v.id,
    slug: v.slug,
  }))
);

console.log(`Catalogue sellable variants: ${variants.length}`);

const password = env.SUPABASE_DB_PASSWORD?.trim();
const projectUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const cs =
  env.DATABASE_URL?.trim() ||
  (password && projectUrl
    ? `postgresql://postgres.${new URL(projectUrl).hostname.split(".")[0]}:${encodeURIComponent(password)}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`
    : null);

if (!cs) {
  console.error("Manjka SUPABASE_DB_PASSWORD / DATABASE_URL");
  process.exit(1);
}

async function main() {
  const client = new pg.Client({
    connectionString: cs,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  let inserted = 0;
  let skipped = 0;
  for (const v of variants) {
    const res = await client.query(
      `insert into public.product_inventory (variant_id, slug, stock_quantity, is_active, currency)
       values ($1, $2, 0, true, 'eur')
       on conflict (variant_id) do nothing`,
      [v.variant_id, v.slug]
    );
    if (res.rowCount === 1) inserted += 1;
    else skipped += 1;
  }

  const { rows } = await client.query(
    `select count(*)::int as n, coalesce(sum(stock_quantity),0)::int as units from product_inventory`
  );
  console.log(`Inserted ${inserted}, already present ${skipped}`);
  console.log(`Inventory total rows=${rows[0].n} sum(stock)=${rows[0].units}`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
