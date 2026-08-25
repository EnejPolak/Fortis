"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getWineBySlug } from "@/data/wine";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCart } from "@/context/CartProvider";
import type { CheckoutItem, DeliveryMethod } from "@/lib/checkout";
import {
  buildOrderSummary,
  PICKUP_LOCATION,
  SHIPPING_CENTS,
} from "@/lib/checkout";
import {
  clearDirectCheckout,
  readDirectCheckout,
} from "@/lib/direct-checkout";
import { getStripeBrowser } from "@/lib/stripe-client";
import styles from "./PlaciloCheckout.module.css";

type ContactForm = {
  email: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  postalCode: string;
  country: string;
};

const appearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#b8956a",
    colorBackground: "#141414",
    colorText: "#ededed",
    colorDanger: "#e8a090",
    fontFamily: "Libre Baskerville, serif",
    borderRadius: "0px",
  },
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function PaymentForm({
  clientSecret,
  orderTotalCents,
  currency,
  contact,
  deliveryMethod,
}: {
  clientSecret: string;
  orderTotalCents: number;
  currency: string;
  contact: ContactForm;
  deliveryMethod: DeliveryMethod;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const billingAddress =
    deliveryMethod === "delivery"
      ? {
          line1: contact.line1,
          city: contact.city,
          postal_code: contact.postalCode,
          country: contact.country,
        }
      : {
          line1: PICKUP_LOCATION.line1,
          city: PICKUP_LOCATION.city,
          postal_code: PICKUP_LOCATION.postalCode,
          country: PICKUP_LOCATION.country,
        };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const returnUrl = `${window.location.origin}/vino/uspeh`;

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: returnUrl,
        receipt_email: contact.email,
        payment_method_data: {
          billing_details: {
            email: contact.email,
            name: contact.fullName,
            phone: contact.phone,
            address: billingAddress,
          },
        },
        ...(deliveryMethod === "delivery"
          ? {
              shipping: {
                name: contact.fullName,
                phone: contact.phone,
                address: {
                  line1: contact.line1,
                  city: contact.city,
                  postal_code: contact.postalCode,
                  country: contact.country,
                },
              },
            }
          : {}),
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Plačilo ni uspelo.");
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.sectionLabel}>Plačilo</p>
      <div className={styles.paymentBox}>
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>
      <p className={styles.stripeNote}>
        Plačilo in potrdilo po emailu obdeluje Stripe. Podatke kartice ne shranjujemo
        na naši strani.
      </p>
      <button type="submit" className={styles.payBtn} disabled={!stripe || loading}>
        {loading
          ? "Obdelujem …"
          : `Plačaj ${formatMoney(orderTotalCents, currency)}`}
      </button>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function OrderSummaryAside({
  order,
  deliveryMethod,
  step,
}: {
  order: NonNullable<ReturnType<typeof buildOrderSummary>>;
  deliveryMethod: DeliveryMethod | null;
  step: 1 | 2;
}) {
  const shippingLabel =
    deliveryMethod === "pickup"
      ? "Brezplačno"
      : deliveryMethod === "delivery"
        ? formatMoney(order.shippingCents, order.currency)
        : `od ${formatMoney(SHIPPING_CENTS, order.currency)}`;

  return (
    <aside className={styles.summary}>
      <p className={styles.summaryTitle}>Povzetek</p>
      {order.lines.map((line) => {
        const wine = getWineBySlug(line.slug);
        return (
          <div key={line.slug} className={styles.summaryLine}>
            <div className={styles.summaryLineInfo}>
              {wine ? (
                <div className={styles.summaryThumb}>
                  <Image
                    src={wine.imageSrc}
                    alt={`${line.name} ${line.vintage}`}
                    width={40}
                    height={60}
                  />
                </div>
              ) : null}
              <span>
                {line.name} {line.vintage} × {line.quantity}
              </span>
            </div>
            <span>{formatMoney(line.lineCents, order.currency)}</span>
          </div>
        );
      })}
      {step === 2 && deliveryMethod ? (
        <div className={styles.summaryFulfillment}>
          <span>
            {deliveryMethod === "pickup" ? "Prevzem v atelierju" : "Dostava na naslov"}
          </span>
        </div>
      ) : null}
      <div className={styles.summarySubtotal}>
        <span>Vmesna vsota</span>
        <span>{formatMoney(order.subtotalCents, order.currency)}</span>
      </div>
      <div className={styles.summaryShipping}>
        <span>Poštnina</span>
        <span>{shippingLabel}</span>
      </div>
      <div className={styles.summaryTotal}>
        <span>Skupaj za plačilo</span>
        <span>
          {deliveryMethod
            ? formatMoney(order.totalCents, order.currency)
            : formatMoney(order.subtotalCents, order.currency)}
        </span>
      </div>
      {!deliveryMethod ? (
        <p className={styles.summaryHint}>
          Končni znesek se izračuna po izbiri prevzema ali dostave.
        </p>
      ) : null}
    </aside>
  );
}

export function PlaciloCheckout() {
  const router = useRouter();
  const { items: cartItems } = useCart();
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[] | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState("");
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [contact, setContact] = useState<ContactForm>({
    email: "",
    fullName: "",
    phone: "",
    line1: "",
    city: "",
    postalCode: "",
    country: "SI",
  });

  useEffect(() => {
    const direct = readDirectCheckout();
    if (direct?.items.length) {
      setCheckoutItems(direct.items);
      clearDirectCheckout();
      return;
    }
    if (cartItems.length) {
      setCheckoutItems(cartItems);
      return;
    }
    router.replace("/kosarica");
  }, [cartItems, router]);

  const order = useMemo(
    () =>
      checkoutItems
        ? buildOrderSummary(checkoutItems, deliveryMethod ?? "delivery")
        : null,
    [checkoutItems, deliveryMethod]
  );

  useEffect(() => {
    if (step !== 2 || !checkoutItems?.length || !deliveryMethod) return;

    let cancelled = false;
    setClientSecret(null);
    setInitError("");
    setLoadingPayment(true);

    (async () => {
      try {
        const res = await fetch("/api/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: checkoutItems, deliveryMethod }),
        });
        const data = await res.json();
        if (!res.ok || !data.clientSecret) {
          throw new Error(data.error ?? "Napaka pri pripravi plačila.");
        }
        if (!cancelled) setClientSecret(data.clientSecret);
      } catch (err) {
        if (!cancelled) {
          setInitError(
            err instanceof Error ? err.message : "Napaka pri pripravi plačila."
          );
        }
      } finally {
        if (!cancelled) setLoadingPayment(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [checkoutItems, deliveryMethod, step]);

  const stripePromise = useMemo(() => getStripeBrowser(), []);

  const contactValid =
    contact.email.includes("@") &&
    contact.fullName.trim().length > 1 &&
    contact.phone.trim().length > 5 &&
    (deliveryMethod === "pickup" ||
      (contact.line1.trim().length > 2 &&
        contact.city.trim().length > 1 &&
        contact.postalCode.trim().length > 2));

  const handleContinue = () => {
    if (!deliveryMethod) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setClientSecret(null);
    setInitError("");
  };

  if (!checkoutItems || !order) {
    return (
      <main className={styles.main}>
        <p className={styles.loading}>Nalagam …</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <Link href="/kosarica" className={styles.backLink}>
          ← Nazaj na košarico
        </Link>
        <p className={styles.eyebrow}>Fortis Selection</p>
        <h1 className={styles.title}>Plačilo</h1>

        <div className={styles.stepIndicator} aria-label="Koraki plačila">
          <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ""}`}>
            <span className={styles.stepNumber}>1</span>
            <span>Način prevzema</span>
          </div>
          <span className={styles.stepDivider} aria-hidden />
          <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ""}`}>
            <span className={styles.stepNumber}>2</span>
            <span>Podatki in plačilo</span>
          </div>
        </div>

        <div className={styles.leftCol}>
          <div className={styles.wineShowcase}>
            {order.lines.map((line) => {
              const wine = getWineBySlug(line.slug);
              if (!wine) return null;
              return (
                <div key={line.slug} className={styles.wineCard}>
                  <div className={styles.wineImageWrap}>
                    <Image
                      src={wine.imageSrc}
                      alt={`${wine.name} ${wine.vintage}`}
                      width={120}
                      height={180}
                      className={styles.wineImage}
                    />
                  </div>
                  <div className={styles.wineMeta}>
                    <p className={styles.wineName}>
                      {wine.name} {wine.vintage}
                    </p>
                    <p className={styles.wineTagline}>{wine.tagline}</p>
                    <p className={styles.wineQty}>Količina: {line.quantity}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {step === 1 ? (
            <div className={styles.deliveryStep}>
              <p className={styles.sectionLabel}>Kako želite prejeti naročilo?</p>
              <div className={styles.deliveryOptions}>
                <button
                  type="button"
                  className={`${styles.deliveryOption} ${
                    deliveryMethod === "pickup" ? styles.deliveryOptionActive : ""
                  }`}
                  onClick={() => setDeliveryMethod("pickup")}
                >
                  <span className={styles.deliveryOptionTitle}>Prevzem v atelierju</span>
                  <span className={styles.deliveryOptionDesc}>
                    Brez poštnine. Prevzemite v Fortis Niche Atelier, Ljubljana.
                  </span>
                  <span className={styles.deliveryOptionMeta}>
                    {PICKUP_LOCATION.line1}, {PICKUP_LOCATION.postalCode}{" "}
                    {PICKUP_LOCATION.city}
                  </span>
                  <span className={styles.deliveryOptionPrice}>Brezplačno</span>
                </button>

                <button
                  type="button"
                  className={`${styles.deliveryOption} ${
                    deliveryMethod === "delivery" ? styles.deliveryOptionActive : ""
                  }`}
                  onClick={() => setDeliveryMethod("delivery")}
                >
                  <span className={styles.deliveryOptionTitle}>Dostava na naslov</span>
                  <span className={styles.deliveryOptionDesc}>
                    Pošljemo na vaš naslov v Sloveniji in sosednjih državah.
                  </span>
                  <span className={styles.deliveryOptionPrice}>
                    +{formatMoney(SHIPPING_CENTS, order.currency)}
                  </span>
                </button>
              </div>

              <button
                type="button"
                className={styles.continueBtn}
                disabled={!deliveryMethod}
                onClick={handleContinue}
              >
                Nadaljuj
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className={styles.backStepBtn}
                onClick={handleBackToStep1}
              >
                ← Spremeni način prevzema
              </button>

              {deliveryMethod === "pickup" ? (
                <div className={styles.pickupNote}>
                  <p className={styles.sectionLabel}>Prevzem</p>
                  <p>
                    Prevzem v atelierju: {PICKUP_LOCATION.line1},{" "}
                    {PICKUP_LOCATION.postalCode} {PICKUP_LOCATION.city}. Delovni čas:{" "}
                    <Link href="/delovni-cas">pon–sob 16:00–20:00</Link>.
                  </p>
                </div>
              ) : null}

              <div className={styles.form}>
                <p className={styles.sectionLabel}>Podatki</p>
                <div className={styles.field}>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={contact.email}
                    onChange={(e) =>
                      setContact((c) => ({ ...c, email: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="fullName">Ime in priimek</label>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    value={contact.fullName}
                    onChange={(e) =>
                      setContact((c) => ({ ...c, fullName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="phone">Telefon</label>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={contact.phone}
                    onChange={(e) =>
                      setContact((c) => ({ ...c, phone: e.target.value }))
                    }
                    required
                  />
                </div>

                {deliveryMethod === "delivery" ? (
                  <>
                    <div className={styles.field}>
                      <label htmlFor="line1">Naslov za dostavo</label>
                      <input
                        id="line1"
                        type="text"
                        autoComplete="street-address"
                        value={contact.line1}
                        onChange={(e) =>
                          setContact((c) => ({ ...c, line1: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label htmlFor="city">Kraj</label>
                        <input
                          id="city"
                          type="text"
                          autoComplete="address-level2"
                          value={contact.city}
                          onChange={(e) =>
                            setContact((c) => ({ ...c, city: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="postalCode">Poštna št.</label>
                        <input
                          id="postalCode"
                          type="text"
                          autoComplete="postal-code"
                          value={contact.postalCode}
                          onChange={(e) =>
                            setContact((c) => ({ ...c, postalCode: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="country">Država</label>
                      <select
                        id="country"
                        value={contact.country}
                        onChange={(e) =>
                          setContact((c) => ({ ...c, country: e.target.value }))
                        }
                      >
                        <option value="SI">Slovenija</option>
                        <option value="HR">Hrvaška</option>
                        <option value="AT">Avstrija</option>
                        <option value="IT">Italija</option>
                        <option value="DE">Nemčija</option>
                      </select>
                    </div>
                  </>
                ) : null}
              </div>

              {initError ? (
                <p className={styles.error} role="alert">
                  {initError}
                </p>
              ) : null}

              {loadingPayment ? (
                <p className={styles.loading}>Pripravljam plačilo …</p>
              ) : clientSecret && contactValid ? (
                <Elements
                  key={clientSecret}
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance,
                  }}
                >
                  <PaymentForm
                    clientSecret={clientSecret}
                    orderTotalCents={order.totalCents}
                    currency={order.currency}
                    contact={contact}
                    deliveryMethod={deliveryMethod!}
                  />
                </Elements>
              ) : clientSecret ? (
                <p className={styles.stripeNote}>
                  Izpolni vse podatke zgoraj, nato se prikaže plačilni obrazec.
                </p>
              ) : null}
            </>
          )}
        </div>

        <OrderSummaryAside
          order={order}
          deliveryMethod={deliveryMethod}
          step={step}
        />
      </div>
    </main>
  );
}
