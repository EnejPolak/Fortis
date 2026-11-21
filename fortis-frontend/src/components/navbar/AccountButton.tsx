"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { createBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export function AccountButton() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;
    const supabase = createBrowserSupabase();

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSignedIn(Boolean(data.session?.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setSignedIn(Boolean(session?.user));
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const href = signedIn ? "/racun" : "/prijava";
  const label = signedIn ? "Moj račun" : "Prijava";

  return (
    <Link
      href={href}
      className="navbar-icon-btn navbar-account-btn"
      aria-label={label}
      data-tooltip={label}
    >
      <User
        className="navbar-account-icon"
        size={27}
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </Link>
  );
}
