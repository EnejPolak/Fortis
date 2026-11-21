"use client";

import { FormEvent, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function ProfileForm({
  email,
  fullName: initialName,
  phone: initialPhone,
}: {
  email: string;
  fullName: string;
  phone: string;
}) {
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);
    try {
      const supabase = createBrowserSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("error");
        setMessage("Seja je potekla. Prijavite se znova.");
        return;
      }
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        setStatus("error");
        setMessage("Shranjevanje ni uspelo.");
        return;
      }
      setStatus("ok");
      setMessage("Shranjeno.");
    } catch {
      setStatus("error");
      setMessage("Omrežna napaka.");
    }
  }

  return (
    <form className="shop-form auth-shell" onSubmit={onSubmit}>
      <div className="shop-field">
        <label className="shop-label" htmlFor="profile-email">
          E-pošta
        </label>
        <input
          id="profile-email"
          className="shop-input"
          value={email}
          disabled
          readOnly
        />
        <p className="purchase-feedback-msg purchase-feedback-msg--muted">
          Sprememba e-pošte poteka prek varnostnih nastavitev ponudnika prijave.
        </p>
      </div>
      <div className="shop-field">
        <label className="shop-label" htmlFor="profile-name">
          Ime in priimek
        </label>
        <input
          id="profile-name"
          className="shop-input"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="shop-field">
        <label className="shop-label" htmlFor="profile-phone">
          Telefon <span className="shop-optional">(neobvezno)</span>
        </label>
        <input
          id="profile-phone"
          className="shop-input"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      {message ? (
        <p
          className={
            status === "error"
              ? "shop-field-error"
              : "purchase-feedback-msg"
          }
          role="status"
        >
          {message}
        </p>
      ) : null}
      <button type="submit" className="shop-primary" disabled={status === "saving"}>
        {status === "saving" ? "Shranjujem…" : "Shrani"}
      </button>
    </form>
  );
}
