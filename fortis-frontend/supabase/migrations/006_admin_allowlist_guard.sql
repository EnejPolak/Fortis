-- Prevent clients from self-granting administrator privileges.
-- profiles.is_admin may only be changed by service_role / postgres, never by
-- authenticated users. Application auth still requires ADMIN_EMAILS allowlist.

create or replace function public.protect_profile_is_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allow service_role / postgres / supabase_admin to change the flag.
  if coalesce(auth.role(), '') in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  -- JWT role authenticated/anon: freeze is_admin to existing value (or false on insert)
  if tg_op = 'INSERT' then
    new.is_admin := false;
  elsif tg_op = 'UPDATE' then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_is_admin on public.profiles;
create trigger protect_profile_is_admin
  before insert or update on public.profiles
  for each row execute function public.protect_profile_is_admin();

-- Clear any non-allowlisted admin flags is an application concern;
-- do not invent emails here. Operators should set ADMIN_EMAILS and optionally
-- reset: update profiles set is_admin = false where is_admin = true;

revoke update (is_admin) on public.profiles from authenticated, anon;

notify pgrst, 'reload schema';
