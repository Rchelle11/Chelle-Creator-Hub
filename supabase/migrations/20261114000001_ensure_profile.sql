-- Accounts created before the schema existed (or whose trigger failed) have no
-- profile row, which leaves them stuck. Repair them, and let the app self-heal.

create or replace function public.ensure_profile()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.profiles (id, full_name)
  select u.id, coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1))
  from auth.users u where u.id = auth.uid()
  on conflict (id) do nothing;
end $$;
revoke execute on function public.ensure_profile() from anon;

-- Backfill any existing auth users without a profile.
insert into public.profiles (id, full_name)
select u.id, coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1))
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
