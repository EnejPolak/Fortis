"use client";

import { FormEvent, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

type Address = {
  id: string;
  full_name: string;
  line1: string;
  line2: string | null;
  city: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
};

export function AddressesManager({ initial }: { initial: Address[] }) {
  const [addresses, setAddresses] = useState(initial);
  const [fullName, setFullName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = createBrowserSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Seja je potekla.");
        setPending(false);
        return;
      }
      const { data, error: insertError } = await supabase
        .from("customer_addresses")
        .insert({
          user_id: user.id,
          full_name: fullName,
          line1,
          line2: line2 || null,
          city,
          postal_code: postalCode,
          country: "SI",
          phone: phone || null,
          is_default: addresses.length === 0,
        })
        .select("*")
        .single();
      if (insertError || !data) {
        setError("Naslova ni bilo mogoče shraniti.");
        setPending(false);
        return;
      }
      setAddresses((prev) => [data as Address, ...prev]);
      setFullName("");
      setLine1("");
      setLine2("");
      setCity("");
      setPostalCode("");
      setPhone("");
      setMessage("Naslov shranjen.");
      setPending(false);
    } catch {
      setError("Omrežna napaka.");
      setPending(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    const supabase = createBrowserSupabase();
    const { error: delError } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", id);
    if (delError) {
      setError("Brisanje ni uspelo.");
      return;
    }
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="shop-grid">
      {addresses.length === 0 ? (
        <p className="shop-lead">Še nimate shranjenih naslovov.</p>
      ) : (
        <ul className="order-list">
          {addresses.map((address) => (
            <li key={address.id} className="order-list-item" style={{ display: "block" }}>
              <p className="order-list-id">{address.full_name}</p>
              <p className="order-list-meta">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.postal_code} {address.city}
              </p>
              <button
                type="button"
                className="shop-secondary"
                onClick={() => remove(address.id)}
              >
                Odstrani
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="shop-form auth-shell" onSubmit={onSubmit}>
        <h2 className="shop-section-title">Dodaj naslov</h2>
        {error ? <p className="shop-field-error">{error}</p> : null}
        {message ? <p className="purchase-feedback-msg">{message}</p> : null}
        <div className="shop-field">
          <label className="shop-label" htmlFor="addr-name">
            Ime in priimek
          </label>
          <input
            id="addr-name"
            className="shop-input"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="shop-field">
          <label className="shop-label" htmlFor="addr-line1">
            Ulica in hišna številka
          </label>
          <input
            id="addr-line1"
            className="shop-input"
            required
            autoComplete="address-line1"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
          />
        </div>
        <div className="shop-field">
          <label className="shop-label" htmlFor="addr-line2">
            Dodatno <span className="shop-optional">(neobvezno)</span>
          </label>
          <input
            id="addr-line2"
            className="shop-input"
            autoComplete="address-line2"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
          />
        </div>
        <div className="shop-field-row">
          <div className="shop-field">
            <label className="shop-label" htmlFor="addr-postal">
              Poštna številka
            </label>
            <input
              id="addr-postal"
              className="shop-input"
              required
              autoComplete="postal-code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>
          <div className="shop-field">
            <label className="shop-label" htmlFor="addr-city">
              Kraj
            </label>
            <input
              id="addr-city"
              className="shop-input"
              required
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>
        <div className="shop-field">
          <label className="shop-label" htmlFor="addr-phone">
            Telefon <span className="shop-optional">(neobvezno)</span>
          </label>
          <input
            id="addr-phone"
            className="shop-input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <button type="submit" className="shop-primary" disabled={pending}>
          {pending ? "Shranjujem…" : "Shrani naslov"}
        </button>
      </form>
    </div>
  );
}
