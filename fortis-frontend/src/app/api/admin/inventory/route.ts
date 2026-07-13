import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { getAllInventory, setStock } from "@/lib/inventory";
import { getWineBySlug } from "@/data/wine";

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);
    const rows = await getAllInventory();

    const inventory = rows.map((row) => {
      const wine = getWineBySlug(row.wine_slug);
      return {
        ...row,
        name: wine?.name ?? row.wine_slug,
        vintage: wine?.vintage ?? "",
      };
    });

    return NextResponse.json({ inventory });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "ADMIN_EMAILS not configured"
          ? 500
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminUser(request);
    const body = await request.json();
    const slug = typeof body?.wine_slug === "string" ? body.wine_slug : "";
    const quantity =
      typeof body?.stock_quantity === "number"
        ? Math.floor(body.stock_quantity)
        : NaN;

    if (!slug || !Number.isFinite(quantity) || quantity < 0) {
      return NextResponse.json({ error: "Neveljavni podatki." }, { status: 400 });
    }

    if (!getWineBySlug(slug)) {
      return NextResponse.json({ error: "Vino ni najdeno." }, { status: 404 });
    }

    const row = await setStock(slug, quantity);
    const wine = getWineBySlug(slug);

    return NextResponse.json({
      ...row,
      name: wine?.name ?? slug,
      vintage: wine?.vintage ?? "",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "ADMIN_EMAILS not configured"
          ? 500
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
