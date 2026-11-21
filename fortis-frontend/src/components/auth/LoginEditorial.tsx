"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export function LoginEditorial() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/racun";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="login-editorial">
        <Link href="/" className="login-home-link">
          <span aria-hidden="true">← </span>Domov
        </Link>
        <div className="shop-banner shop-banner--error">
          Prijava še ni konfigurirana (Supabase).
        </div>
      </div>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);

    try {
      const supabase = createBrowserSupabase();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError("Prijava ni uspela. Preverite podatke ali poskusite znova.");
        setPending(false);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Omrežna napaka.");
      setPending(false);
    }
  }

  return (
    <div className="login-editorial">
      <Link href="/" className="login-home-link">
        <span aria-hidden="true">← </span>Domov
      </Link>

      <div className="login-editorial-grid">
        <aside className="login-brand" aria-labelledby="login-brand-heading">
          <p className="login-brand-label">Moj Fortis</p>
          <h1 id="login-brand-heading" className="login-brand-headline">
            Vaš svet.
            <br />
            Vaše dišave.
            <br />
            Vaš Fortis.
          </h1>
          <p className="login-brand-support">
            Dišava za vsak okus. Najdite svojo.
          </p>
        </aside>

        <section className="login-panel" aria-labelledby="login-form-heading">
          <h2 id="login-form-heading" className="login-panel-title">
            Prijava
          </h2>
          <p className="login-panel-lead">Dobrodošli nazaj.</p>

          <form className="login-form" onSubmit={onSubmit} noValidate>
            {error ? (
              <div className="shop-banner shop-banner--error" role="alert">
                {error}
              </div>
            ) : null}

            <div className="login-field">
              <label className="login-label" htmlFor="login-email">
                E-pošta
              </label>
              <input
                id="login-email"
                className="login-input"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="ime@primer.si"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="login-password">
                Geslo
              </label>
              <div className="login-password-wrap">
                <input
                  id="login-password"
                  className="login-input login-input--password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={pending}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Skrij geslo" : "Prikaži geslo"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={1.5} aria-hidden="true" />
                  ) : (
                    <Eye size={18} strokeWidth={1.5} aria-hidden="true" />
                  )}
                </button>
              </div>
              <div className="login-forgot-row">
                <Link href="/pozabljeno-geslo" className="login-forgot-link">
                  Pozabljeno geslo?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit btn-commerce-primary"
              disabled={pending}
              aria-busy={pending}
            >
              <span className="login-submit-label">
                {pending ? "Prijavljam…" : "Prijava"}
              </span>
            </button>

            <p className="login-register">
              Še nimate računa?{" "}
              <Link
                href={`/ustvari-racun?next=${encodeURIComponent(next)}`}
                className="login-register-link"
              >
                Ustvarite račun
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
