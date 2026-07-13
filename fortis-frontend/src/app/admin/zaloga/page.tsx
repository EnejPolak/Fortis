import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminStockPage } from "@/components/admin/AdminStockPage";

export const metadata: Metadata = {
  title: "Zaloga vina",
  robots: { index: false, follow: false },
};

export default function AdminZalogaPage() {
  return (
    <AdminGate>
      <AdminStockPage />
    </AdminGate>
  );
}
