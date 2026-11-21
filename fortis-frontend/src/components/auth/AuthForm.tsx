"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

type Mode = "login" | "register" | "forgot" | "reset";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/racun";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="shop-banner shop-banner--error">
        Prijava še ni konfigurirana (Supabase).
      </div>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setMessage(null);
    setPending(true);

    try {
      const supabase = createBrowserSupabase();

      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) {
          setError("Prijava ni uspela. Preverite podatke ali poskusite znova.");
          setPending(false);
          return;
        }
        // Guest cart stays in localStorage; CartProvider already owns it.
        // Same variant lines merge on add — no duplicate storage keys.
        router.replace(next);
        router.refresh();
        return;
      }

      if (mode === "register") {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (authError) {
          setError("Računa ni bilo mogoče ustvariti. Poskusite znova.");
          setPending(false);
          return;
        }
        setMessage(
          "Če je e-pošta veljavna, boste prejeli povezavo za potrditev (če je omogočena)."
        );
        setPending(false);
        return;
      }

      if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/racun/varnost")}`,
          }
        );
        if (authError) {
          setError("Zahteve ni bilo mogoče poslati. Poskusite znova.");
          setPending(false);
          return;
        }
        setMessage(
          "Če račun obstaja, smo poslali povezavo za ponastavitev gesla."
        );
        setPending(false);
        return;
      }

      if (mode === "reset") {
        const { error: authError } = await supabase.auth.updateUser({
          password,
        });
        if (authError) {
          setError("Gesla ni bilo mogoče posodobiti. Zahtevajte novo povezavo.");
          setPending(false);
          return;
        }
        setMessage("Geslo je posodobljeno.");
        router.replace("/racun");
        router.refresh();
      }
    } catch {
      setError("Omrežna napaka.");
      setPending(false);
    }
  }

  const title =
    mode === "login"
      ? "Prijava"
      : mode === "register"
        ? "Ustvari račun"
        : mode === "forgot"
          ? "Pozabljeno geslo"
          : "Novo geslo";

  return (
    <div className="auth-shell">
      <h1 className="shop-title">{title}</h1>
      <form className="shop-form" onSubmit={onSubmit}>
        {error ? (
          <div className="shop-banner shop-banner--error" role="alert">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="shop-banner shop-banner--ok" role="status">
            {message}
          </div>
        ) : null}

        {mode === "register" ? (
          <div className="shop-field">
            <label className="shop-label" htmlFor="auth-name">
              Ime in priimek <span className="shop-optional">(neobvezno)</span>
            </label>
            <input
              id="auth-name"
              className="shop-input"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        ) : null}

        {mode !== "reset" ? (
          <div className="shop-field">
            <label className="shop-label" htmlFor="auth-email">
              E-pošta
            </label>
            <input
              id="auth-email"
              className="shop-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        ) : null}

        {mode === "login" || mode === "register" || mode === "reset" ? (
          <div className="shop-field">
            <label className="shop-label" htmlFor="auth-password">
              Geslo
            </label>
            <div className="password-field">
              <input
                id="auth-password"
                className="shop-input"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
              >
                {showPassword ? "Skrij" : "Prikaži"}
              </button>
            </div>
          </div>
        ) : null}

        <button type="submit" className="shop-primary" disabled={pending}>
          {pending ? "Pošiljam…" : title}
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {mode === "login" ? (
            <>
              <Link href={`/ustvari-racun?next=${encodeURIComponent(next)}`} className="shop-secondary">
                Ustvari račun
              </Link>
              <Link href="/pozabljeno-geslo" className="shop-secondary">
                Pozabljeno geslo
              </Link>
            </>
          ) : null}
          {mode === "register" || mode === "forgot" ? (
            <Link href={`/prijava?next=${encodeURIComponent(next)}`} className="shop-secondary">
              Nazaj na prijavo
            </Link>
          ) : null}
        </div>
      </form>
    </div>
  );
}
