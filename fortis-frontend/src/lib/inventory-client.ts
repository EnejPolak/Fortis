export async function fetchInventory(slug: string): Promise<{
  stock: number;
  available: number;
  inStock: boolean;
}> {
  const res = await fetch(`/api/inventory/${slug}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Napaka pri branju zaloge.");
  }
  return res.json();
}
