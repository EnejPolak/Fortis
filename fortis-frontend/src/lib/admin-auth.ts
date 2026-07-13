import { createClient } from "@/utils/supabase/server";

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = getAdminEmails();
  if (!allowed.length) return false;
  return allowed.includes(email.trim().toLowerCase());
}

function getBearerToken(request?: Request): string | null {
  const header = request?.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

export async function getAdminUserFromRequest(request?: Request) {
  const supabase = await createClient();
  const token = getBearerToken(request);

  const {
    data: { user },
  } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return null;
  }

  return user;
}

export async function getAdminUser() {
  return getAdminUserFromRequest();
}

export async function requireAdminUser(request?: Request) {
  if (!getAdminEmails().length) {
    throw new Error("ADMIN_EMAILS not configured");
  }

  const user = await getAdminUserFromRequest(request);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
