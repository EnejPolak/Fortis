import { NextResponse } from "next/server";
import { pingDatabase } from "@/lib/orders";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await pingDatabase();
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/keepalive]", error);
    return NextResponse.json(
      { ok: false, error: "Database ping failed" },
      { status: 500 }
    );
  }
}
