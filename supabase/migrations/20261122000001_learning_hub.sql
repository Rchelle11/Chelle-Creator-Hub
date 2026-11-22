-- Chelle Learning Hub: free students can take part, a content library,
-- student messages, challenge prizes, and an honest launch price.

-- 1. Any active, signed-in student can post, vote, comment and message.
--    (Paid lessons stay locked by enrollment; this only opens the community.)
create or replace function public.has_access()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active'
  );
$$;

-- 2. A student cannot vote for their own video. One vote per video is the
--    likes primary key (post_id, user_id).
drop policy if exists "likes create" on public.likes;
create policy "likes create" on public.likes for insert
  with check (
    user_id = auth.uid() and public.has_access()
    and not exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
  );

create or replace function public.on_like_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_name text;
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id returning user_id into v_owner;
    if v_owner is not null and v_owner <> new.user_id then
      select full_name into v_name from public.profiles where id = new.user_id;
      perform public.notify(v_owner, 'like', coalesce(v_name, 'Someone') || ' voted for your video', '', '/battles/' || new.post_id);
    end if;
    return new;
  else
    update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
    return old;
  end if;
end $$;

-- 3. Student videos get a title (description stays in caption).
alter table public.posts add column if not exists title text not null default '';

-- 4. Challenges can name a prize or opportunity.
alter table public.challenges add column if not exists prize text not null default '';

-- 5. Community: new categories, optional image, announcements for admins only.
alter table public.community_posts drop constraint if exists community_posts_category_check;
alter table public.community_posts add constraint community_posts_category_check check (category = any (array[
  'questions','feedback','wins','challenges','announcements',
  'general','video-editing','ai-video','capcut','content-ideas','freelancing']));
alter table public.community_posts add column if not exists image_url text;
drop policy if exists "community create" on public.community_posts;
create policy "community create" on public.community_posts for insert
  with check (user_id = auth.uid() and public.has_access() and not pinned
              and (category <> 'announcements' or public.is_admin()));

-- 6. Simple direct messages between students (and with Chelle).
drop policy if exists "messages send" on public.messages;
create policy "messages send" on public.messages for insert
  with check (
    sender_id = auth.uid() and public.has_access() and recipient_id <> auth.uid()
    and exists (select 1 from public.profiles p where p.id = recipient_id and p.status = 'active')
  );

-- 7. Learn library: articles, videos, tips and downloads posted by the admin.
create table if not exists public.learn_items (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null check (kind in ('article','video','tip','resource')),
  title          text not null check (char_length(title) between 1 and 200),
  slug           text not null unique,
  excerpt        text not null default '',
  body           text not null default '',
  thumbnail_url  text,
  video_url      text,
  file_url       text,
  published      boolean not null default false,
  author_id      uuid references public.profiles (id) on delete set null,
  like_count     int not null default 0,
  comment_count  int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists learn_items_kind_idx on public.learn_items (kind, published, created_at desc);

create table if not exists public.learn_likes (
  item_id     uuid not null references public.learn_items (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (item_id, user_id)
);
create table if not exists public.learn_comments (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.learn_items (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index if not exists learn_comments_item_idx on public.learn_comments (item_id, created_at);

alter table public.learn_items enable row level security;
alter table public.learn_likes enable row level security;
alter table public.learn_comments enable row level security;

drop policy if exists "learn readable" on public.learn_items;
create policy "learn readable" on public.learn_items for select using (published or public.is_admin());
drop policy if exists "learn admin" on public.learn_items;
create policy "learn admin" on public.learn_items for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "llikes readable" on public.learn_likes;
create policy "llikes readable" on public.learn_likes for select using (true);
drop policy if exists "llikes create" on public.learn_likes;
create policy "llikes create" on public.learn_likes for insert with check (user_id = auth.uid() and public.has_access());
drop policy if exists "llikes delete" on public.learn_likes;
create policy "llikes delete" on public.learn_likes for delete using (user_id = auth.uid());

drop policy if exists "lcomments readable" on public.learn_comments;
create policy "lcomments readable" on public.learn_comments for select using (true);
drop policy if exists "lcomments create" on public.learn_comments;
create policy "lcomments create" on public.learn_comments for insert with check (user_id = auth.uid() and public.has_access());
drop policy if exists "lcomments delete" on public.learn_comments;
create policy "lcomments delete" on public.learn_comments for delete using (user_id = auth.uid() or public.is_admin());

create or replace function public.on_learn_like_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update public.learn_items set like_count = like_count + 1 where id = new.item_id; return new;
  else update public.learn_items set like_count = greatest(like_count - 1, 0) where id = old.item_id; return old; end if;
end $$;
drop trigger if exists learn_like_count on public.learn_likes;
create trigger learn_like_count after insert or delete on public.learn_likes for each row execute function public.on_learn_like_change();

create or replace function public.on_learn_comment_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update public.learn_items set comment_count = comment_count + 1 where id = new.item_id; return new;
  else update public.learn_items set comment_count = greatest(comment_count - 1, 0) where id = old.item_id; return old; end if;
end $$;
drop trigger if exists learn_comment_count on public.learn_comments;
create trigger learn_comment_count after insert or delete on public.learn_comments for each row execute function public.on_learn_comment_change();

-- Counters are maintained by triggers only.
create or replace function public.guard_learn_counts()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('postgres', 'supabase_admin') and pg_trigger_depth() = 1 then
    new.like_count := old.like_count; new.comment_count := old.comment_count;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists learn_items_guard on public.learn_items;
create trigger learn_items_guard before update on public.learn_items for each row execute function public.guard_learn_counts();

-- 8. Launch price that ends by itself: the launch price applies while fewer
--    than `launch_spots` payments have been approved, then the regular price.
alter table public.courses add column if not exists launch_price numeric(10,2);
alter table public.courses add column if not exists launch_spots int check (launch_spots is null or launch_spots > 0);

create or replace function public.course_offer(p_course_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_course public.courses; v_taken int; v_open boolean;
begin
  select * into v_course from public.courses where id = p_course_id and published;
  if not found then return null; end if;
  select count(*) into v_taken from public.payments where course_id = p_course_id and status = 'approved';
  v_open := v_course.launch_price is not null and v_course.launch_spots is not null and v_taken < v_course.launch_spots;
  return jsonb_build_object(
    'price', case when v_open then v_course.launch_price else v_course.price end,
    'regular', v_course.price,
    'launch', v_open,
    'spots_total', v_course.launch_spots,
    'spots_left', case when v_open then v_course.launch_spots - v_taken else 0 end);
end $$;
grant execute on function public.course_offer(uuid) to anon, authenticated;

create or replace function public.quote_price(p_course_id uuid, p_code text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_course public.courses; v_code public.discount_codes; v_base numeric; v_amount numeric;
begin
  select * into v_course from public.courses where id = p_course_id and published;
  if not found then raise exception 'Course not found'; end if;
  v_base := (public.course_offer(p_course_id) ->> 'price')::numeric;
  v_amount := v_base;
  if p_code is not null and length(trim(p_code)) > 0 then
    select * into v_code from public.discount_codes
     where upper(code) = upper(trim(p_code)) and active
       and (course_id is null or course_id = p_course_id)
       and (expires_at is null or expires_at > now())
       and (max_uses is null or uses < max_uses);
    if not found then
      return jsonb_build_object('valid', false, 'original', v_base, 'amount', v_base,
                                'message', 'This code is invalid or expired.');
    end if;
    if v_code.percent_off is not null then
      v_amount := round(v_amount * (100 - v_code.percent_off) / 100.0, 2);
    else
      v_amount := greatest(v_amount - v_code.amount_off, 0);
    end if;
    return jsonb_build_object('valid', true, 'code', v_code.code, 'code_id', v_code.id,
                              'original', v_base, 'amount', v_amount, 'discount', v_base - v_amount);
  end if;
  return jsonb_build_object('valid', null, 'original', v_base, 'amount', v_amount);
end $$;
