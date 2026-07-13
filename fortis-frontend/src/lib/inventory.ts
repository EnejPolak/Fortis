import type { CheckoutItem } from "@/lib/checkout";
import { getWineBySlug } from "@/data/wine";
import { createAdminClient } from "@/utils/supabase/admin";

const MAX_PER_ORDER = 12;

export type InventoryRow = {
  wine_slug: string;
  stock_quantity: number;
  updated_at: string;
};

export async function getStock(slug: string): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wine_inventory")
    .select("stock_quantity")
    .eq("wine_slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.stock_quantity ?? 0;
}

export async function getAvailableQuantity(slug: string): Promise<number> {
  const stock = await getStock(slug);
  const wine = getWineBySlug(slug);
  const maxPerOrder = wine?.maxQuantity ?? MAX_PER_ORDER;
  return Math.min(stock, maxPerOrder);
}

export async function getAllInventory(): Promise<InventoryRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wine_inventory")
    .select("wine_slug, stock_quantity, updated_at")
    .order("wine_slug");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function setStock(slug: string, quantity: number): Promise<InventoryRow> {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error("Neveljavna količina zaloge.");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wine_inventory")
    .upsert({
      wine_slug: slug,
      stock_quantity: Math.floor(quantity),
      updated_at: new Date().toISOString(),
    })
    .select("wine_slug, stock_quantity, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Napaka pri shranjevanju zaloge.");
  }

  return data;
}

export async function assertItemsInStock(items: CheckoutItem[]): Promise<void> {
  for (const { slug, quantity } of items) {
    const wine = getWineBySlug(slug);
    if (!wine) throw new Error(`Vino ${slug} ni najdeno.`);

    const stock = await getStock(slug);
    const maxAllowed = Math.min(stock, wine.maxQuantity);

    if (stock <= 0) {
      throw new Error(`${wine.name} ${wine.vintage} je trenutno razprodano.`);
    }

    if (quantity > stock) {
      throw new Error(
        `Na zalogi je le ${stock} ${stock === 1 ? "kos" : "kosov"} ${wine.name} ${wine.vintage}.`
      );
    }

    if (quantity > maxAllowed) {
      throw new Error(
        `Največ ${maxAllowed} kosov na naročilo za ${wine.name} ${wine.vintage}.`
      );
    }
  }
}

export async function decrementStock(
  items: { slug: string; quantity: number }[]
): Promise<void> {
  const supabase = createAdminClient();

  for (const { slug, quantity } of items) {
    const { data: row, error: readError } = await supabase
      .from("wine_inventory")
      .select("stock_quantity")
      .eq("wine_slug", slug)
      .maybeSingle();

    if (readError) throw new Error(readError.message);
    if (!row || row.stock_quantity < quantity) {
      const wine = getWineBySlug(slug);
      throw new Error(
        `Ni dovolj zaloge za ${wine?.name ?? slug} (potrebno ${quantity}, na zalogi ${row?.stock_quantity ?? 0}).`
      );
    }

    const nextQty = row.stock_quantity - quantity;
    const { data: updated, error: updateError } = await supabase
      .from("wine_inventory")
      .update({
        stock_quantity: nextQty,
        updated_at: new Date().toISOString(),
      })
      .eq("wine_slug", slug)
      .eq("stock_quantity", row.stock_quantity)
      .select("wine_slug")
      .maybeSingle();

    if (updateError) throw new Error(updateError.message);
    if (!updated) {
      throw new Error(`Zaloga za ${slug} se je spremenila — poskusi znova.`);
    }
  }
}
