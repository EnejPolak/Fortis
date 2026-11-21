import { ProfileForm } from "@/components/account/ProfileForm";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return <p className="shop-banner shop-banner--error">Račun ni na voljo.</p>;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <ProfileForm
      email={user.email ?? ""}
      fullName={profile?.full_name ?? ""}
      phone={profile?.phone ?? ""}
    />
  );
}
