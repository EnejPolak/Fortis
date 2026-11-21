"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatEurFromCents } from "@/lib/commerce/money";
import { getFulfillmentOptions, type FulfillmentMethod } from "@/lib/commerce/shipping";

type FieldErrors = Record<string, string>;

export function CheckoutForm({
  cancelled,
}: {
  cancelled?: boolean;
}) {
  const { lines, subtotalCents, ready } = useCart();
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>("pickup");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [billingSame, setBillingSame] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const firstErrorRef = useRef<HTMLInputElement | null>(null);

  const options = useMemo(() => getFulfillmentOptions(), []);
  const selected = options.find((o) => o.id === fulfillment)!;
  const shippingCents = selected.available ? selected.cents : 0;
  const totalCents = subtotalCents + shippingCents;

  useEffect(() => {
    if (formError || Object.keys(errors).length === 0) return;
    firstErrorRef.current?.focus();
  }, [errors, formError]);

  if (!ready) {
    return <p className="shop-lead">Nalagam košarico…</p>;
  }

  if (lines.length === 0) {
    return (
      <div>
        <p className="shop-lead">Košarica je prazna.</p>
        <Link href="/kolekcija" className="shop-secondary">
          Nazaj v kolekcijo
        </Link>
      </div>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors: FieldErrors = {};
    if (!email.trim()) nextErrors.email = "Vnesite e-pošto.";
    if (!fullName.trim()) nextErrors.fullName = "Vnesite ime in priimek.";
    if (fulfillment === "delivery") {
      if (!line1.trim()) nextErrors.line1 = "Vnesite naslov.";
      if (!city.trim()) nextErrors.city = "Vnesite kraj.";
      if (!postalCode.trim()) nextErrors.postalCode = "Vnesite poštno številko.";
    }
    if (!selected.available) {
      setFormError(selected.unavailableReason ?? "Način prevzema ni na voljo.");
      setErrors(nextErrors);
      return;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError("Preverite označena polja.");
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName,
          phone,
          fulfillment,
          billingSameAsShipping: billingSame,
          shippingAddress:
            fulfillment === "delivery"
              ? {
                  fullName,
                  line1,
                  line2,
                  city,
                  postalCode,
                  country: "SI",
                  phone,
                }
              : undefined,
          lines: lines.map((l) => ({
            variantId: l.variantId,
            quantity: l.quantity,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setFormError(data.error ?? "Blagajne ni bilo mogoče začeti.");
        setSubmitting(false);
        return;
      }

      // Keep cart until webhook confirms payment; clear only after redirect success page verifies paid.
      // Soft-clear optimistic local note: confirmation page clears when paid.
      window.sessionStorage.setItem(
        "fortis.pendingOrder",
        JSON.stringify({ orderNumber: data.orderNumber, at: Date.now() })
      );
      window.location.href = data.url;
    } catch {
      setFormError("Omrežna napaka. Poskusite znova.");
      setSubmitting(false);
    }
  }

  return (
    <div className="shop-grid shop-grid--checkout">
      <form className="shop-form" onSubmit={onSubmit} noValidate>
        {cancelled ? (
          <div className="shop-banner" role="status">
            Plačilo je bilo preklicano. Košarica je ohranjena — lahko poskusite znova.
          </div>
        ) : null}
        {formError ? (
          <div className="shop-banner shop-banner--error" role="alert">
            {formError}
          </div>
        ) : null}

        <section className="shop-section" aria-labelledby="checkout-contact">
          <h2 id="checkout-contact" className="shop-section-title">
            Kontakt
          </h2>
          <div className="shop-field">
            <label className="shop-label" htmlFor="checkout-email">
              E-pošta
            </label>
            <input
              ref={errors.email ? firstErrorRef : undefined}
              id="checkout-email"
              className="shop-input"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email ? <p className="shop-field-error">{errors.email}</p> : null}
          </div>
          <div className="shop-field-row">
            <div className="shop-field">
              <label className="shop-label" htmlFor="checkout-name">
                Ime in priimek
              </label>
              <input
                id="checkout-name"
                className="shop-input"
                type="text"
                name="name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              {errors.fullName ? (
                <p className="shop-field-error">{errors.fullName}</p>
              ) : null}
            </div>
            <div className="shop-field">
              <label className="shop-label" htmlFor="checkout-phone">
                Telefon <span className="shop-optional">(neobvezno)</span>
              </label>
              <input
                id="checkout-phone"
                className="shop-input"
                type="tel"
                name="phone"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="shop-section" aria-labelledby="checkout-fulfillment">
          <h2 id="checkout-fulfillment" className="shop-section-title">
            Prevzem
          </h2>
          <div className="shop-radio-list">
            {options.map((option) => (
              <label
                key={option.id}
                className={`shop-radio${fulfillment === option.id ? " shop-radio--selected" : ""}${!option.available ? " shop-radio--disabled" : ""}`}
              >
                <input
                  type="radio"
                  name="fulfillment"
                  value={option.id}
                  checked={fulfillment === option.id}
                  disabled={!option.available}
                  onChange={() => setFulfillment(option.id)}
                />
                <span>
                  <strong>
                    {option.label}
                    {option.available
                      ? option.cents === 0
                        ? " — brezplačno"
                        : ` — ${formatEurFromCents(option.cents)}`
                      : ""}
                  </strong>
                  <span>{option.description}</span>
                  {!option.available && option.unavailableReason ? (
                    <span>{option.unavailableReason}</span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </section>

        {fulfillment === "delivery" ? (
          <section className="shop-section" aria-labelledby="checkout-address">
            <h2 id="checkout-address" className="shop-section-title">
              Naslov za dostavo
            </h2>
            <div className="shop-field">
              <label className="shop-label" htmlFor="checkout-line1">
                Ulica in hišna številka
              </label>
              <input
                id="checkout-line1"
                className="shop-input"
                autoComplete="address-line1"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
              />
              {errors.line1 ? <p className="shop-field-error">{errors.line1}</p> : null}
            </div>
            <div className="shop-field">
              <label className="shop-label" htmlFor="checkout-line2">
                Dodatno <span className="shop-optional">(neobvezno)</span>
              </label>
              <input
                id="checkout-line2"
                className="shop-input"
                autoComplete="address-line2"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
              />
            </div>
            <div className="shop-field-row">
              <div className="shop-field">
                <label className="shop-label" htmlFor="checkout-postal">
                  Poštna številka
                </label>
                <input
                  id="checkout-postal"
                  className="shop-input"
                  autoComplete="postal-code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
                {errors.postalCode ? (
                  <p className="shop-field-error">{errors.postalCode}</p>
                ) : null}
              </div>
              <div className="shop-field">
                <label className="shop-label" htmlFor="checkout-city">
                  Kraj
                </label>
                <input
                  id="checkout-city"
                  className="shop-input"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                {errors.city ? <p className="shop-field-error">{errors.city}</p> : null}
              </div>
            </div>
            <label className="shop-label" style={{ display: "flex", gap: "0.6rem" }}>
              <input
                type="checkbox"
                checked={billingSame}
                onChange={(e) => setBillingSame(e.target.checked)}
              />
              Račun na isti naslov
            </label>
          </section>
        ) : null}

        <section className="shop-section">
          <p className="shop-lead" style={{ marginBottom: 0 }}>
            Plačilo poteka varno prek Stripe. Podatkov o kartici ne shranjujemo.
          </p>
          <button type="submit" className="shop-primary" disabled={submitting}>
            {submitting ? "Pripravljam plačilo…" : "Nadaljuj na plačilo"}
          </button>
          <p className="purchase-feedback-msg purchase-feedback-msg--muted">
            Računa ni treba ustvariti. Če želite, se lahko prijavite kadarkoli.
          </p>
        </section>
      </form>

      <aside className="shop-summary" aria-labelledby="checkout-summary">
        <h2 id="checkout-summary" className="shop-summary-title">
          Povzetek
        </h2>
        {lines.map((line) => (
          <div key={line.variantId} className="shop-summary-line">
            <span>
              {line.brand} — {line.name}
              <br />
              {line.volumeLabel} × {line.quantity}
            </span>
            <span>{formatEurFromCents(line.lineCents)}</span>
          </div>
        ))}
        <div className="shop-summary-line">
          <span>Vmesna vsota</span>
          <span>{formatEurFromCents(subtotalCents)}</span>
        </div>
        <div className="shop-summary-line">
          <span>{selected.label}</span>
          <span>
            {selected.available
              ? shippingCents === 0
                ? "0 €"
                : formatEurFromCents(shippingCents)
              : "—"}
          </span>
        </div>
        <div className="shop-summary-total">
          <span>Skupaj</span>
          <span>{formatEurFromCents(totalCents)}</span>
        </div>
      </aside>
    </div>
  );
}
