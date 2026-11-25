import { createServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/admin";

/**
 * Server-side admin gate.
 * ONLY emails listed in ADMIN_EMAILS (comma-separated) may access administration.
 * profiles.is_admin is a mirror/cache for allowlisted accounts — it cannot
 * independently grant access to anyone outside the allowlist.
 */
export function getAdminAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAdminAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminAllowlist().includes(email.trim().toLowerCase());
}

export async function requireAdmin(): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; status: number; error: string }
> {
  const allowlist = getAdminAllowlist();
  if (allowlist.length === 0) {
    return {
      ok: false,
      status: 503,
      error: "Skrbništvo ni konfigurirano (ADMIN_EMAILS).",
    };
  }

  const userClient = await createServerSupabase();
  if (!userClient) {
    return { ok: false, status: 503, error: "Storitev ni na voljo." };
  }

  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user?.email) {
    return { ok: false, status: 401, error: "Prijava je obvezna." };
  }

  const email = user.email.toLowerCase();
  if (!allowlist.includes(email)) {
    return { ok: false, status: 403, error: "Nimate skrbniških pravic." };
  }

  // Optional mirror: keep profiles.is_admin in sync for allowlisted users only.
  // Never treat is_admin alone as authorization.
  const supabase = getServiceSupabase();
  if (supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && profile.is_admin !== true) {
      await supabase
        .from("profiles")
        .update({ is_admin: true, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    }
  }

  return { ok: true, userId: user.id, email };
}
