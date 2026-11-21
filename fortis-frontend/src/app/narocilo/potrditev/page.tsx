import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/orders/OrderConfirmation";

export const metadata: Metadata = {
  title: "Potrditev naročila",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ order?: string; token?: string }>;
};

export default async function OrderConfirmationPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderNumber = params.order?.trim();

  return (
    <main className="shop-page">
      <div className="shop-shell">
        <h1 className="shop-title">Potrditev naročila</h1>
        {!orderNumber ? (
          <p className="shop-banner shop-banner--error">Manjka številka naročila.</p>
        ) : (
          <OrderConfirmation orderNumber={orderNumber} token={params.token} />
        )}
      </div>
    </main>
  );
}
