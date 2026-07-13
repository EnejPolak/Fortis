import { NextResponse } from "next/server";
import { getAvailableQuantity, getStock } from "@/lib/inventory";
import { getWineBySlug } from "@/data/wine";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const wine = getWineBySlug(slug);

    if (!wine) {
      return NextResponse.json({ error: "Vino ni najdeno." }, { status: 404 });
    }

    const stock = await getStock(slug);
    const available = await getAvailableQuantity(slug);

    return NextResponse.json({
      slug,
      stock,
      available,
      inStock: stock > 0,
    });
  } catch (error) {
    console.error("[api/inventory]", error);
    return NextResponse.json(
      { error: "Napaka pri branju zaloge." },
      { status: 500 }
    );
  }
}
