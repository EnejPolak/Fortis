import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/commerce/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    if (admin.status === 401) {
      redirect("/prijava?next=/admin");
    }
    redirect("/");
  }

  return (
    <div className="shop-page admin-page">
      <header className="admin-header">
        <Link href="/" className="admin-brand">
          FORTIS
        </Link>
        <nav className="admin-nav" aria-label="Skrbništvo">
          <Link href="/admin">Pregled</Link>
          <Link href="/admin/zaloga">Zaloga</Link>
          <Link href="/admin/narocila">Naročila</Link>
          <Link href="/admin/nastavitve">Nastavitve</Link>
        </nav>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
