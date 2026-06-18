"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";
import styles from "./NewsletterSignup.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [consented, setConsented] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setStatus("error");
      setMessage("Vnesite veljaven email naslov.");
      return;
    }

    if (!consented) {
      setStatus("error");
      setMessage("Za prijavo morate soglašati s politiko zasebnosti.");
      return;
    }

    setEmail("");
    setConsented(false);
    setStatus("success");
    setMessage("Hvala za prijavo. Kmalu prejmete Fortis novice.");
  };

  const messageClassName =
    status === "error"
      ? `${styles.message} ${styles.messageError}`
      : status === "success"
        ? `${styles.message} ${styles.messageSuccess}`
        : styles.message;

  return (
    <section className={styles.section} aria-labelledby="newsletter-title">
      <div className={styles.inner}>
        <p className={styles.kicker}>Fortis novice</p>
        <h2 id="newsletter-title" className={styles.title}>
          Prijavite se na e-novice.
        </h2>
        <p className={styles.copy}>
          Prejmite izbrane Fortis novice, nove kolekcije in vabila v atelier.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.label} htmlFor="newsletter-email">
            Email naslov
          </label>
          <input
            id="newsletter-email"
            className={styles.input}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="vas@email.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status !== "idle") {
                setStatus("idle");
                setMessage("");
              }
            }}
            aria-invalid={status === "error"}
            aria-describedby={message ? "newsletter-message" : undefined}
          />
          <button className={styles.button} type="submit">
            Prijavi se
          </button>

          <label className={styles.consent}>
            <input
              className={styles.consentInput}
              type="checkbox"
              checked={consented}
              onChange={(event) => {
                setConsented(event.target.checked);
                if (status !== "idle") {
                  setStatus("idle");
                  setMessage("");
                }
              }}
            />
            <span className={styles.consentText}>
              Strinjam se s{" "}
              <Link href="/privacy-policy" className={styles.consentLink}>
                politiko zasebnosti
              </Link>{" "}
              in soglašam z obdelavo email naslova za prejemanje Fortis novic.
            </span>
          </label>
        </form>

        <p id="newsletter-message" className={messageClassName} aria-live="polite">
          {message}
        </p>
      </div>
    </section>
  );
}
