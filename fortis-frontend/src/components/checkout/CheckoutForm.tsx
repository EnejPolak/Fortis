"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { formatEurFromCents } from "@/lib/commerce/money";
import {
  getFulfillmentOptions,
  type FulfillmentMethod,
} from "@/lib/commerce/shipping";
import {
  createBrowserSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

const DRAFT_KEY = "fortis.checkoutDraft.v1";

type FieldErrors = Record<string, string>;

type Draft = {
  email: string;
  fullName: string;
  phone: string;
  fulfillment: FulfillmentMethod;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  billingSame: boolean;
};

function readDraft(): Partial<Draft> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<Draft>;
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft) {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

export function CheckoutForm({
  cancelled,
  stripeReady,
  testMode,
}: {
  cancelled?: boolean;
  stripeReady: boolean;
  testMode: boolean;
}) {
  const { lines, subtotalCents, ready, openCart } = useCart();
  const draft = useMemo(() => readDraft(), []);

  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>(
    draft?.fulfillment === "delivery" ? "delivery" : "pickup"
  );
  const [email, setEmail] = useState(draft?.email ?? "");
  const [fullName, setFullName] = useState(draft?.fullName ?? "");
  const [phone, setPhone] = useState(draft?.phone ?? "");
  const [line1, setLine1] = useState(draft?.line1 ?? "");
  const [line2, setLine2] = useState(draft?.line2 ?? "");
  const [city, setCity] = useState(draft?.city ?? "");
  const [postalCode, setPostalCode] = useState(draft?.postalCode ?? "");
  const [billingSame, setBillingSame] = useState(draft?.billingSame ?? true);
  const [signedIn, setSignedIn] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const firstErrorRef = useRef<HTMLInputElement | null>(null);
  const prefilledRef = useRef(false);

  const options = useMemo(() => getFulfillmentOptions(), []);
  const pickup = options.find((o) => o.id === "pickup")!;
  const delivery = options.find((o) => o.id === "delivery");
  const selected = options.find((o) => o.id === fulfillment) ?? pickup;
  const shippingCents = selected.available ? selected.cents : 0;
  const totalCents = subtotalCents + shippingCents;

  useEffect(() => {
    writeDraft({
      email,
      fullName,
      phone,
      fulfillment,
      line1,
      line2,
      city,
      postalCode,
      billingSame,
    });
  }, [
    email,
    fullName,
    phone,
    fulfillment,
    line1,
    line2,
    city,
    postalCode,
    billingSame,
  ]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    const supabase = createBrowserSupabase();

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setSignedIn(Boolean(user));
      if (!user || prefilledRef.current) return;
      prefilledRef.current = true;

      setEmail((prev) => prev || user.email || "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profile?.full_name) {
        setFullName((prev) => prev || profile.full_name || "");
      }
      if (profile?.phone) {
        setPhone((prev) => prev || profile.phone || "");
      }
    }

    loadProfile();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (formError || Object.keys(errors).length === 0) return;
    firstErrorRef.current?.focus();
  }, [errors, formError]);

  if (!ready) {
    return (
      <main className="checkout-page">
        <p className="checkout-loading">Nalagam košarico…</p>
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main className="checkout-page checkout-page--empty">
        <div className="checkout-empty">
          <h1 className="checkout-empty-title">Košarica je prazna</h1>
          <p className="checkout-empty-text">
            Dodajte dišavo v košarico, nato nadaljujte na blagajno.
          </p>
          <Link href="/kolekcija" className="checkout-empty-link">
            Raziščite kolekcijo
          </Link>
        </div>
      </main>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (!stripeReady) {
      setFormError(
        "Plačilna povezava še ni aktivna. Poskusite znova kasneje."
      );
      return;
    }

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
      let idempotencyKey = window.sessionStorage.getItem(
        "fortis.checkoutIdempotency"
      );
      if (!idempotencyKey) {
        idempotencyKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `ck-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        window.sessionStorage.setItem(
          "fortis.checkoutIdempotency",
          idempotencyKey
        );
      }

      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
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
          idempotencyKey,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setFormError(data.error ?? "Blagajne ni bilo mogoče začeti.");
        setSubmitting(false);
        return;
      }

      window.sessionStorage.setItem(
        "fortis.pendingOrder",
        JSON.stringify({ orderNumber: data.orderNumber, at: Date.now() })
      );
      window.sessionStorage.removeItem("fortis.checkoutIdempotency");
      window.location.href = data.url;
    } catch {
      setFormError("Omrežna napaka. Poskusite znova.");
      setSubmitting(false);
    }
  }

  return (
    <main className="checkout-page">
      <header className="checkout-topbar">
        <Link href="/" className="checkout-logo">
          FORTIS
        </Link>
        <button
          type="button"
          className="checkout-back-cart"
          onClick={openCart}
        >
          Nazaj v košarico
        </button>
      </header>

      <div className="checkout-split">
        <section className="checkout-main">
          <div className="checkout-main-inner">
            <p className="checkout-eyebrow">Zaključek nakupa</p>
            <h1 className="checkout-title">Blagajna</h1>
            <p className="checkout-lead">Nakup zaključite tudi brez računa.</p>
            {testMode ? (
              <p className="checkout-test-note" role="status">
                <span className="checkout-test-dot" aria-hidden="true" />
                Testni način · Znesek ne bo zaračunan.
              </p>
            ) : null}
            {!stripeReady ? (
              <div className="shop-banner shop-banner--error" role="status">
                Plačilna povezava še ni aktivna.
              </div>
            ) : null}
            {cancelled ? (
              <div className="shop-banner" role="status">
                Plačilo je bilo preklicano. Košarica je ohranjena — lahko
                poskusite znova.
              </div>
            ) : null}
            {formError ? (
              <div className="shop-banner shop-banner--error" role="alert">
                {formError}
              </div>
            ) : null}

            <form
              id="checkout-form"
              className="checkout-form"
              onSubmit={onSubmit}
              noValidate
            >
              <div className="checkout-section">
                <div className="checkout-section-head">
                  <h2 className="checkout-section-title">Kontakt</h2>
                  {!signedIn ? (
                    <Link
                      href={`/prijava?next=${encodeURIComponent("/checkout")}`}
                      className="checkout-login-link"
                    >
                      Prijava
                    </Link>
                  ) : null}
                </div>

                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="checkout-email">
                    E-pošta
                  </label>
                  <input
                    ref={errors.email ? firstErrorRef : undefined}
                    id="checkout-email"
                    className="checkout-input"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={submitting}
                  />
                  {errors.email ? (
                    <p className="checkout-field-error">{errors.email}</p>
                  ) : null}
                </div>

                <div className="checkout-field-row">
                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="checkout-name">
                      Ime in priimek
                    </label>
                    <input
                      id="checkout-name"
                      className="checkout-input"
                      type="text"
                      name="name"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={submitting}
                    />
                    {errors.fullName ? (
                      <p className="checkout-field-error">{errors.fullName}</p>
                    ) : null}
                  </div>
                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="checkout-phone">
                      Telefon{" "}
                      <span className="checkout-optional">(neobvezno)</span>
                    </label>
                    <input
                      id="checkout-phone"
                      className="checkout-input"
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div className="checkout-section">
                <h2 className="checkout-section-title">Prevzem</h2>

                <label
                  className={`checkout-method${fulfillment === "pickup" ? " checkout-method--selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="fulfillment"
                    value="pickup"
                    checked={fulfillment === "pickup"}
                    onChange={() => setFulfillment("pickup")}
                    disabled={submitting}
                  />
                  <span className="checkout-method-radio" aria-hidden="true" />
                  <span className="checkout-method-copy">
                    <span className="checkout-method-title">Osebni prevzem</span>
                    <span className="checkout-method-desc">
                      {pickup.description}
                    </span>
                  </span>
                  <span className="checkout-method-price">
                    {pickup.cents === 0
                      ? "Brezplačno"
                      : formatEurFromCents(pickup.cents)}
                  </span>
                </label>

                {delivery && !delivery.available ? (
                  <p className="checkout-delivery-note">
                    Dostava trenutno ni na voljo.
                  </p>
                ) : null}

                {delivery?.available ? (
                  <label
                    className={`checkout-method${fulfillment === "delivery" ? " checkout-method--selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="fulfillment"
                      value="delivery"
                      checked={fulfillment === "delivery"}
                      onChange={() => setFulfillment("delivery")}
                      disabled={submitting}
                    />
                    <span className="checkout-method-radio" aria-hidden="true" />
                    <span className="checkout-method-copy">
                      <span className="checkout-method-title">Dostava</span>
                      <span className="checkout-method-desc">
                        {delivery.description}
                      </span>
                    </span>
                    <span className="checkout-method-price">
                      {formatEurFromCents(delivery.cents)}
                    </span>
                  </label>
                ) : null}
              </div>

              {fulfillment === "delivery" && delivery?.available ? (
                <div className="checkout-section">
                  <h2 className="checkout-section-title">Naslov za dostavo</h2>
                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="checkout-line1">
                      Ulica in hišna številka
                    </label>
                    <input
                      id="checkout-line1"
                      className="checkout-input"
                      autoComplete="address-line1"
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      disabled={submitting}
                    />
                    {errors.line1 ? (
                      <p className="checkout-field-error">{errors.line1}</p>
                    ) : null}
                  </div>
                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="checkout-line2">
                      Dodatno{" "}
                      <span className="checkout-optional">(neobvezno)</span>
                    </label>
                    <input
                      id="checkout-line2"
                      className="checkout-input"
                      autoComplete="address-line2"
                      value={line2}
                      onChange={(e) => setLine2(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="checkout-field-row">
                    <div className="checkout-field">
                      <label
                        className="checkout-label"
                        htmlFor="checkout-postal"
                      >
                        Poštna številka
                      </label>
                      <input
                        id="checkout-postal"
                        className="checkout-input"
                        autoComplete="postal-code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        disabled={submitting}
                      />
                      {errors.postalCode ? (
                        <p className="checkout-field-error">
                          {errors.postalCode}
                        </p>
                      ) : null}
                    </div>
                    <div className="checkout-field">
                      <label className="checkout-label" htmlFor="checkout-city">
                        Kraj
                      </label>
                      <input
                        id="checkout-city"
                        className="checkout-input"
                        autoComplete="address-level2"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={submitting}
                      />
                      {errors.city ? (
                        <p className="checkout-field-error">{errors.city}</p>
                      ) : null}
                    </div>
                  </div>
                  <label className="checkout-check">
                    <input
                      type="checkbox"
                      checked={billingSame}
                      onChange={(e) => setBillingSame(e.target.checked)}
                      disabled={submitting}
                    />
                    Račun na isti naslov
                  </label>
                </div>
              ) : null}
            </form>
          </div>
        </section>

        <aside className="checkout-summary" aria-labelledby="checkout-order-title">
          <div className="checkout-summary-inner">
            <p className="checkout-eyebrow">Vaš izbor</p>
            <h2 id="checkout-order-title" className="checkout-summary-title">
              Vaše naročilo
            </h2>

            <ul className="checkout-items">
              {lines.map((line) => (
                <li key={line.variantId} className="checkout-item">
                  <div className="checkout-item-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={line.imageSrc} alt="" />
                  </div>
                  <div className="checkout-item-copy">
                    <p className="checkout-item-brand">{line.brand}</p>
                    <p className="checkout-item-name">{line.name}</p>
                    <p className="checkout-item-meta">
                      {line.volumeLabel} × {line.quantity}
                    </p>
                  </div>
                  <p className="checkout-item-total">
                    {formatEurFromCents(line.lineCents)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="checkout-totals">
              <div className="checkout-total-line">
                <span>Vmesna vsota</span>
                <span>{formatEurFromCents(subtotalCents)}</span>
              </div>
              <div className="checkout-total-line">
                <span>{selected.label}</span>
                <span>
                  {selected.available
                    ? shippingCents === 0
                      ? "0 €"
                      : formatEurFromCents(shippingCents)
                    : "—"}
                </span>
              </div>
              <div className="checkout-total-final">
                <span>Skupaj</span>
                <span>{formatEurFromCents(totalCents)}</span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              className="checkout-pay-btn btn-commerce-primary"
              disabled={submitting || !stripeReady}
              aria-busy={submitting}
            >
              <span>{submitting ? "Preusmerjanje …" : "Nadaljuj na plačilo"}</span>
              <span className="checkout-pay-arrow" aria-hidden="true">
                →
              </span>
            </button>
            <p className="checkout-secure">
              <Lock size={14} strokeWidth={1.5} aria-hidden="true" />
              Varno plačilo prek Stripe.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
