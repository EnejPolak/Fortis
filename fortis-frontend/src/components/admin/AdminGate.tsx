"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { adminFetch } from "@/lib/admin-session";

export function AdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        if (!cancelled) router.replace("/admin?error=session");
        return;
      }

      try {
        const res = await adminFetch("/api/admin/whoami");
        const data = await res.json();

        if (!res.ok || !data.ok) {
          await supabase.auth.signOut();
          if (cancelled) return;

          if (data.reason === "env") {
            router.replace("/admin?error=env");
          } else if (data.reason === "not_allowed") {
            router.replace("/admin?denied=1");
          } else {
            router.replace("/admin?error=session");
          }
          return;
        }

        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) router.replace("/admin?error=session");
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return null;
  }

  return children;
}
