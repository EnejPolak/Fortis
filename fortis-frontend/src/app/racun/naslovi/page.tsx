import { AddressesManager } from "@/components/account/AddressesManager";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function AddressesPage() {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return <p className="shop-banner shop-banner--error">Račun ni na voljo.</p>;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: addresses } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <AddressesManager initial={addresses ?? []} />;
}
