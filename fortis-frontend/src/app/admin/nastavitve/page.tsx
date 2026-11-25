import { ATELIER_ADDRESS_LINE } from "@/lib/commerce/atelier";
import { getFulfillmentOptions } from "@/lib/commerce/shipping";
import { isResendConfigured } from "@/lib/commerce/email";
import { isStripeConfigured, isStripeTestMode } from "@/stripe";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { AdminConfigForm } from "@/components/admin/AdminConfigForm";

export default async function AdminSettingsPage() {
  const options = getFulfillmentOptions();
  const supabase = getServiceSupabase();

  let storeConfig: unknown = null;
  if (supabase) {
    const { data } = await supabase
      .from("store_config")
      .select("value")
      .eq("key", "fulfillment")
      .maybeSingle();
    storeConfig = data?.value ?? null;
  }

  const delivery = options.find((o) => o.id === "delivery");

  return (
    <div>
      <h1 className="shop-title">Nastavitve</h1>
      <p className="shop-lead">
        Prevzem in dostava. Dostava je omogočena le, ko je nastavljen
        NEXT_PUBLIC_DELIVERY_CENTS (ali vrednost v store_config).
      </p>

      <section className="shop-section">
        <h2 className="shop-section-title">Status integracij</h2>
        <ul className="admin-stats">
          <li>
            <span>Stripe</span>
            <strong>
              {isStripeConfigured()
                ? isStripeTestMode()
                  ? "test"
                  : "live"
                : "ni"}
            </strong>
          </li>
          <li>
            <span>Resend e-pošta</span>
            <strong>{isResendConfigured() ? "da" : "ne"}</strong>
          </li>
          <li>
            <span>Supabase service</span>
            <strong>{supabase ? "da" : "ne"}</strong>
          </li>
        </ul>
      </section>

      <section className="shop-section">
        <h2 className="shop-section-title">Prevzem</h2>
        <p className="shop-lead">{ATELIER_ADDRESS_LINE}</p>
        <p className="shop-lead">Strošek: 0 € (konfigurirano)</p>
      </section>

      <section className="shop-section">
        <h2 className="shop-section-title">Dostava</h2>
        <p className="shop-lead">
          {delivery?.available
            ? `Omogočena · ${(delivery.cents / 100).toFixed(2)} €`
            : "Onemogočena — nastavite NEXT_PUBLIC_DELIVERY_CENTS ali store_config."}
        </p>
        <AdminConfigForm initial={storeConfig} />
      </section>
    </div>
  );
}
