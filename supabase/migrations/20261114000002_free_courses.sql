-- Free courses / tutorials: a published course with price = 0 can be joined
-- instantly, without a payment or admin approval.

create or replace function public.enroll_free(p_course_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.courses where id = p_course_id and published and price = 0) then
    raise exception 'This course is not free';
  end if;
  insert into public.enrollments (user_id, course_id, status)
  values (auth.uid(), p_course_id, 'active')
  on conflict (user_id, course_id) do nothing;
end $$;
revoke execute on function public.enroll_free(uuid) from anon;

-- Posting in Battles / community / challenges stays a paid-student benefit:
-- a free course alone does not unlock it.
create or replace function public.has_access()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.enrollments e
    join public.profiles p on p.id = e.user_id
    join public.courses c on c.id = e.course_id
    where e.user_id = auth.uid() and e.status in ('active', 'completed')
      and p.status = 'active' and c.price > 0
  );
$$;
