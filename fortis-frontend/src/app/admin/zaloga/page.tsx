import { listSellableProducts } from "@/lib/commerce/catalog";
import { getServiceSupabase } from "@/lib/supabase/admin";
import {
  AdminInventoryTable,
  type AdminInventoryRow,
} from "@/components/admin/AdminInventoryTable";

export default async function AdminStockPage() {
  const products = listSellableProducts();
  const supabase = getServiceSupabase();

  const inventory = new Map<
    string,
    {
      stock_quantity: number;
      unit_cents: number | null;
      is_active: boolean;
      sku: string | null;
    }
  >();
  const reservedByVariant = new Map<string, number>();

  if (supabase) {
    const ids = products.flatMap((p) => p.variants.map((v) => v.id));
    if (ids.length) {
      const { data } = await supabase
        .from("product_inventory")
        .select("variant_id, stock_quantity, unit_cents, is_active, sku")
        .in("variant_id", ids);
      for (const row of data ?? []) {
        inventory.set(row.variant_id, row);
      }

      const { data: reservations } = await supabase
        .from("inventory_reservations")
        .select("variant_id, quantity")
        .eq("status", "active")
        .in("variant_id", ids);

      for (const row of reservations ?? []) {
        reservedByVariant.set(
          row.variant_id,
          (reservedByVariant.get(row.variant_id) ?? 0) + (row.quantity ?? 0)
        );
      }
    }
  }

  const rows: AdminInventoryRow[] = products.flatMap((product) =>
    product.variants.map((variant) => {
      const inv = inventory.get(variant.id);
      const available = inv?.stock_quantity ?? 0;
      const reserved = reservedByVariant.get(variant.id) ?? 0;
      return {
        variantId: variant.id,
        slug: product.slug,
        brand: product.brand,
        name: product.name,
        volumeLabel: variant.volumeLabel,
        catalogueCents: variant.unitCents,
        sku: inv?.sku ?? "",
        unitCentsOverride: inv?.unit_cents ?? null,
        isActive: inv?.is_active ?? true,
        available,
        reserved,
        physical: available + reserved,
        exists: Boolean(inv),
      };
    })
  );

  return (
    <div>
      <h1 className="shop-title">Zaloga in cene</h1>
      <p className="shop-lead">
        Katalog ostane v kodi. Tukaj vpišete razpoložljivo zalogo (brez aktivnih
        rezervacij), SKU in aktivnost. Rezervacije se ob spremembi zaloge ne
        prepišejo.
      </p>
      <AdminInventoryTable rows={rows} />
    </div>
  );
}
