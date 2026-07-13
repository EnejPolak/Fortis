import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAdminEmails, isAdminEmail } from "@/lib/admin-auth";

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

export async function GET(request: Request) {
  const adminEmailsConfigured = getAdminEmails().length > 0;

  if (!adminEmailsConfigured) {
    return NextResponse.json({
      ok: false,
      reason: "env",
      adminEmailsConfigured: false,
    });
  }

  const supabase = await createClient();
  const token = getBearerToken(request);
  const {
    data: { user },
  } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({
      ok: false,
      reason: "no_session",
      adminEmailsConfigured,
    });
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({
      ok: false,
      reason: "not_allowed",
      email: user.email,
      adminEmailsConfigured,
    });
  }

  return NextResponse.json({
    ok: true,
    email: user.email,
    adminEmailsConfigured,
  });
}
