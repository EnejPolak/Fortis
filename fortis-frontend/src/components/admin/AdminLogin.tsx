"use client";

import { useState, type FormEvent, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { adminFetch } from "@/lib/admin-session";
import styles from "./AdminLogin.module.css";

export function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const denied = searchParams.get("denied") === "1";
  const sessionError = searchParams.get("error") === "session";
  const envError = searchParams.get("error") === "env";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkExistingSession() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      try {
        const res = await adminFetch("/api/admin/whoami");
        const data = await res.json();
        if (data.ok) {
          router.replace("/admin/zaloga");
        }
      } catch {
        // ignore
      }
    }

    checkExistingSession();
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError("Napačen email ali geslo.");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Prijava je uspela, a seja ni bila ustvarjena. Poskusi znova.");
        return;
      }

      const check = await adminFetch("/api/admin/whoami");
      const data = await check.json();

      if (!data.ok) {
        if (data.reason === "no_session") {
          setError(
            "Strežnik ne vidi prijave. Poskusi znova ali kontaktiraj podporo."
          );
        } else if (!data.adminEmailsConfigured || data.reason === "env") {
          setError(
            "ADMIN_EMAILS ni nastavljen. Dodaj v .env.local in restartaj npm run dev."
          );
        } else if (data.reason === "not_allowed") {
          setError(
            `Email ${data.email ?? session.user.email ?? email} ni v ADMIN_EMAILS.`
          );
        } else {
          setError("Nimaš dostopa do admin panela.");
        }
        await supabase.auth.signOut();
        return;
      }

      router.replace("/admin/zaloga");
    } catch {
      setError("Prijava ni uspela. Poskusi znova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Fortis Admin</p>
        <h1 className={styles.title}>Prijava</h1>
        <p className={styles.hint}>Dostop samo za pooblaščene uporabnike.</p>

        {envError ? (
          <p className={styles.error} role="alert">
            ADMIN_EMAILS ni nastavljen na strežniku. Dodaj v .env.local (ali Vercel) in
            restartaj server.
          </p>
        ) : null}

        {sessionError ? (
          <p className={styles.error} role="alert">
            Strežnik ne vidi prijave. Restartaj dev server in poskusi znova.
          </p>
        ) : null}

        {denied ? (
          <p className={styles.error} role="alert">
            Ta račun nima dostopa do admin panela. Email mora biti v ADMIN_EMAILS.
          </p>
        ) : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Email
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className={styles.label}>
            Geslo
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Prijavljanje …" : "Prijava"}
          </button>
        </form>
      </div>
    </main>
  );
}
