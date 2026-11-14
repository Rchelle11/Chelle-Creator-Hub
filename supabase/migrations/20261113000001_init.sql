-- =====================================================================
-- ROCHELLE OS — Short Video Masterclass
-- Initial schema: tables, row level security, storage, business logic
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type public.user_role         as enum ('student', 'admin');
create type public.account_status    as enum ('active', 'suspended');
create type public.payment_status    as enum ('pending', 'approved', 'rejected');
create type public.payment_method    as enum ('gcash', 'gotyme', 'paypal');
create type public.enrollment_status as enum ('active', 'suspended', 'completed');
create type public.post_status       as enum ('published', 'pending', 'hidden');
create type public.challenge_status  as enum ('draft', 'active', 'ended');
create type public.resource_kind     as enum ('pdf', 'template', 'prompt', 'link');

-- ---------------------------------------------------------------------
-- Profiles (public creator identity; email stays in auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  full_name       text not null default '',
  username        text unique,
  avatar_url      text,
  bio             text not null default '',
  role            public.user_role not null default 'student',
  status          public.account_status not null default 'active',
  is_private      boolean not null default false,
  notify_email    boolean not null default true,
  notify_push     boolean not null default true,
  last_active_at  timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Courses / modules / lessons
-- ---------------------------------------------------------------------
create table public.courses (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  subtitle         text not null default '',
  description      text not null default '',
  thumbnail_url    text,
  instructor_name  text not null default 'Rochelle',
  instructor_bio   text not null default '',
  price            numeric(10,2) not null default 0,
  currency         text not null default 'PHP',
  published        boolean not null default false,
  created_at       timestamptz not null default now()
);

create table public.modules (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete cascade,
  title        text not null,
  description  text not null default '',
  position     int not null default 0,
  created_at   timestamptz not null default now()
);
create index on public.modules (course_id, position);

-- Lesson metadata: visible to anyone browsing a published course outline.
create table public.lessons (
  id                uuid primary key default gen_random_uuid(),
  module_id         uuid not null references public.modules (id) on delete cascade,
  course_id         uuid not null references public.courses (id) on delete cascade,
  title             text not null,
  description       text not null default '',
  thumbnail_url     text,
  duration_seconds  int not null default 0,
  position          int not null default 0,
  is_preview        boolean not null default false,
  published         boolean not null default true,
  created_at        timestamptz not null default now()
);
create index on public.lessons (module_id, position);
create index on public.lessons (course_id);

-- Paid content: only enrolled students (or preview lessons / admins).
create table public.lesson_content (
  lesson_id   uuid primary key references public.lessons (id) on delete cascade,
  video_path  text,            -- object path in the private `course-media` bucket
  video_url   text,            -- optional external stream URL (Mux, Bunny, Vimeo...)
  body        text not null default '',
  updated_at  timestamptz not null default now()
);

create table public.lesson_resources (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.lessons (id) on delete cascade,
  kind        public.resource_kind not null,
  title       text not null,
  file_path   text,            -- object path in `course-media`
  url         text,
  content     text,            -- e.g. AI prompt text
  position    int not null default 0
);
create index on public.lesson_resources (lesson_id);

-- ---------------------------------------------------------------------
-- Enrollment + progress
-- ---------------------------------------------------------------------
create table public.enrollments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  course_id         uuid not null references public.courses (id) on delete cascade,
  status            public.enrollment_status not null default 'active',
  progress_percent  int not null default 0,
  last_lesson_id    uuid references public.lessons (id) on delete set null,
  last_viewed_at    timestamptz,
  enrolled_at       timestamptz not null default now(),
  completed_at      timestamptz,
  unique (user_id, course_id)
);

create table public.lesson_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  lesson_id       uuid not null references public.lessons (id) on delete cascade,
  course_id       uuid not null references public.courses (id) on delete cascade,
  completed       boolean not null default false,
  completed_at    timestamptz,
  last_viewed_at  timestamptz not null default now(),
  unique (user_id, lesson_id)
);
create index on public.lesson_progress (user_id, course_id);

create table public.lesson_notes (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  lesson_id   uuid not null references public.lessons (id) on delete cascade,
  content     text not null default '',
  updated_at  timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ---------------------------------------------------------------------
-- Commerce
-- ---------------------------------------------------------------------
create table public.discount_codes (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  course_id     uuid references public.courses (id) on delete cascade,
  percent_off   int check (percent_off between 1 and 100),
  amount_off    numeric(10,2) check (amount_off > 0),
  max_uses      int,
  uses          int not null default 0,
  active        boolean not null default true,
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  check (percent_off is not null or amount_off is not null)
);

create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  course_id         uuid not null references public.courses (id) on delete cascade,
  amount            numeric(10,2) not null,
  original_amount   numeric(10,2) not null,
  discount_code_id  uuid references public.discount_codes (id) on delete set null,
  method            public.payment_method not null,
  reference_number  text not null,
  sender_name       text not null,
  sender_number     text not null default '',
  receipt_path      text not null,   -- object path in private `receipts` bucket
  status            public.payment_status not null default 'pending',
  rejection_reason  text,
  submitted_at      timestamptz not null default now(),
  reviewed_at       timestamptz,
  approved_at       timestamptz,
  reviewed_by       uuid references public.profiles (id)
);
create index on public.payments (status, submitted_at desc);
create index on public.payments (user_id);
-- One open (pending) submission per student per course.
create unique index payments_one_pending on public.payments (user_id, course_id) where status = 'pending';

-- ---------------------------------------------------------------------
-- Challenges
-- ---------------------------------------------------------------------
create table public.challenges (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  description          text not null default '',
  instructions         text not null default '',
  cover_url            text,
  reference_video_url  text,
  days                 int not null default 1 check (days between 1 and 60),
  start_date           date not null default current_date,
  end_date             date not null default (current_date + 7),
  status               public.challenge_status not null default 'active',
  created_at           timestamptz not null default now()
);

create table public.challenge_participants (
  challenge_id  uuid not null references public.challenges (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  joined_at     timestamptz not null default now(),
  completed_at  timestamptz,
  primary key (challenge_id, user_id)
);

-- ---------------------------------------------------------------------
-- Bottle (creator feed)
-- ---------------------------------------------------------------------
create table public.posts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  video_url      text not null,
  video_path     text,               -- object path in `bottle` bucket (for cleanup)
  poster_url     text,
  caption        text not null default '',
  tags           text[] not null default '{}',
  challenge_id   uuid references public.challenges (id) on delete set null,
  status         public.post_status not null default 'published',
  featured       boolean not null default false,
  pinned         boolean not null default false,
  like_count     int not null default 0,
  comment_count  int not null default 0,
  created_at     timestamptz not null default now()
);
create index on public.posts (status, pinned desc, created_at desc);
create index on public.posts (user_id);
create index on public.posts using gin (tags);

create table public.likes (
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  parent_id   uuid references public.comments (id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index on public.comments (post_id, created_at);

create table public.challenge_submissions (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.challenges (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  post_id       uuid references public.posts (id) on delete set null,
  day           int not null default 1,
  explanation   text not null default '',
  status        text not null default 'submitted' check (status in ('submitted', 'featured', 'winner')),
  created_at    timestamptz not null default now(),
  unique (challenge_id, user_id, day)
);

-- ---------------------------------------------------------------------
-- Community discussions
-- ---------------------------------------------------------------------
create table public.community_posts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  category       text not null check (category in
                   ('general','questions','video-editing','ai-video','capcut','content-ideas','freelancing','wins')),
  title          text not null check (char_length(title) between 1 and 200),
  body           text not null default '',
  like_count     int not null default 0,
  comment_count  int not null default 0,
  pinned         boolean not null default false,
  created_at     timestamptz not null default now()
);
create index on public.community_posts (category, created_at desc);

create table public.community_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.community_posts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  parent_id   uuid references public.community_comments (id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 4000),
  created_at  timestamptz not null default now()
);

create table public.community_likes (
  post_id  uuid not null references public.community_posts (id) on delete cascade,
  user_id  uuid not null references public.profiles (id) on delete cascade,
  primary key (post_id, user_id)
);

-- ---------------------------------------------------------------------
-- Announcements / notifications / messages
-- ---------------------------------------------------------------------
create table public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null default '',
  image_url   text,
  link_url    text,
  publish_at  timestamptz not null default now(),
  created_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now()
);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null,  -- payment_approved, payment_rejected, new_lesson, announcement, comment, reply, like, challenge, featured, milestone, message
  title       text not null,
  message     text not null default '',
  link        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on public.notifications (user_id, read, created_at desc);

create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references public.profiles (id) on delete cascade,
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  content       text not null check (char_length(content) between 1 and 4000),
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);
create index on public.messages (recipient_id, created_at desc);
create index on public.messages (sender_id, created_at desc);

-- =====================================================================
-- Helper functions
-- =====================================================================
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_enrolled(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e
    join public.profiles p on p.id = e.user_id
    where e.user_id = auth.uid() and e.course_id = p_course_id
      and e.status in ('active', 'completed') and p.status = 'active'
  );
$$;

-- Community/Bottle participation requires an active enrollment (or admin).
create or replace function public.has_access()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.enrollments e
    join public.profiles p on p.id = e.user_id
    where e.user_id = auth.uid() and e.status in ('active', 'completed') and p.status = 'active'
  );
$$;

create or replace function public.notify(p_user uuid, p_type text, p_title text, p_message text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, type, title, message, link)
  values (p_user, p_type, p_title, coalesce(p_message, ''), p_link);
$$;
revoke execute on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;

-- New auth user -> profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Students may not change their own role / status.
-- SECURITY INVOKER on purpose: current_user is 'authenticated' only for direct API
-- writes, not for updates made inside trusted security-definer functions.
create or replace function public.guard_profile_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() and (new.role <> old.role or new.status <> old.status) then
    raise exception 'Not allowed to change role or status';
  end if;
  return new;
end $$;
create trigger guard_profile_update before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Students may edit caption/tags of own posts but not moderation fields.
create or replace function public.guard_post_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.status := old.status; new.featured := old.featured; new.pinned := old.pinned;
    new.like_count := old.like_count; new.comment_count := old.comment_count;
    new.user_id := old.user_id;
  end if;
  return new;
end $$;
create trigger guard_post_update before update on public.posts
  for each row execute function public.guard_post_update();

-- =====================================================================
-- Counters + notification triggers
-- =====================================================================
create or replace function public.on_like_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_name text;
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id returning user_id into v_owner;
    if v_owner is not null and v_owner <> new.user_id then
      select full_name into v_name from public.profiles where id = new.user_id;
      perform public.notify(v_owner, 'like', v_name || ' liked your video', '', '/bottle/' || new.post_id);
    end if;
    return new;
  else
    update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
    return old;
  end if;
end $$;
create trigger likes_count after insert or delete on public.likes
  for each row execute function public.on_like_change();

create or replace function public.on_comment_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_parent_owner uuid; v_name text;
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id returning user_id into v_owner;
    select full_name into v_name from public.profiles where id = new.user_id;
    if new.parent_id is not null then
      select user_id into v_parent_owner from public.comments where id = new.parent_id;
      if v_parent_owner is not null and v_parent_owner <> new.user_id then
        perform public.notify(v_parent_owner, 'reply', v_name || ' replied to your comment', left(new.content, 140), '/bottle/' || new.post_id);
      end if;
    end if;
    if v_owner is not null and v_owner <> new.user_id and v_owner is distinct from v_parent_owner then
      perform public.notify(v_owner, 'comment', v_name || ' commented on your video', left(new.content, 140), '/bottle/' || new.post_id);
    end if;
    return new;
  else
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    return old;
  end if;
end $$;
create trigger comments_count after insert or delete on public.comments
  for each row execute function public.on_comment_change();

create or replace function public.on_community_comment_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_name text;
begin
  if tg_op = 'INSERT' then
    update public.community_posts set comment_count = comment_count + 1 where id = new.post_id returning user_id into v_owner;
    if v_owner is not null and v_owner <> new.user_id then
      select full_name into v_name from public.profiles where id = new.user_id;
      perform public.notify(v_owner, 'comment', v_name || ' replied to your discussion', left(new.content, 140), '/community/' || new.post_id);
    end if;
    return new;
  else
    update public.community_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    return old;
  end if;
end $$;
create trigger community_comments_count after insert or delete on public.community_comments
  for each row execute function public.on_community_comment_change();

create or replace function public.on_community_like_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts set like_count = like_count + 1 where id = new.post_id; return new;
  else
    update public.community_posts set like_count = greatest(like_count - 1, 0) where id = old.post_id; return old;
  end if;
end $$;
create trigger community_likes_count after insert or delete on public.community_likes
  for each row execute function public.on_community_like_change();

create or replace function public.on_post_featured()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.featured and not old.featured then
    perform public.notify(new.user_id, 'featured', '⭐ Your video was featured!',
      'Your work is now showcased in Featured Creators.', '/bottle/' || new.id);
  end if;
  return new;
end $$;
create trigger post_featured after update of featured on public.posts
  for each row execute function public.on_post_featured();

create or replace function public.on_announcement_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, message, link)
  select p.id, 'announcement', '🔔 ' || new.title, left(new.content, 160), '/announcements'
  from public.profiles p where p.status = 'active';
  return new;
end $$;
create trigger announcement_notify after insert on public.announcements
  for each row execute function public.on_announcement_insert();

create or replace function public.on_message_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  select full_name into v_name from public.profiles where id = new.sender_id;
  perform public.notify(new.recipient_id, 'message', 'New message from ' || v_name, left(new.content, 140), '/messages');
  return new;
end $$;
create trigger message_notify after insert on public.messages
  for each row execute function public.on_message_insert();

create or replace function public.on_lesson_published()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.published and (tg_op = 'INSERT' or not old.published) then
    insert into public.notifications (user_id, type, title, message, link)
    select e.user_id, 'new_lesson', 'New lesson added', new.title, '/courses/' || c.slug || '/' || new.id
    from public.enrollments e join public.courses c on c.id = e.course_id
    where e.course_id = new.course_id and e.status in ('active', 'completed');
  end if;
  return new;
end $$;
create trigger lesson_published after insert or update of published on public.lessons
  for each row execute function public.on_lesson_published();

-- =====================================================================
-- Business logic (RPC)
-- =====================================================================

-- Price a checkout server-side. Never trust a client-supplied amount.
create or replace function public.quote_price(p_course_id uuid, p_code text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_course public.courses; v_code public.discount_codes; v_amount numeric;
begin
  select * into v_course from public.courses where id = p_course_id and published;
  if not found then raise exception 'Course not found'; end if;
  v_amount := v_course.price;
  if p_code is not null and length(trim(p_code)) > 0 then
    select * into v_code from public.discount_codes
     where upper(code) = upper(trim(p_code)) and active
       and (course_id is null or course_id = p_course_id)
       and (expires_at is null or expires_at > now())
       and (max_uses is null or uses < max_uses);
    if not found then
      return jsonb_build_object('valid', false, 'original', v_course.price, 'amount', v_course.price,
                                'message', 'This code is invalid or expired.');
    end if;
    if v_code.percent_off is not null then
      v_amount := round(v_amount * (100 - v_code.percent_off) / 100.0, 2);
    else
      v_amount := greatest(v_amount - v_code.amount_off, 0);
    end if;
    return jsonb_build_object('valid', true, 'code', v_code.code, 'code_id', v_code.id,
                              'original', v_course.price, 'amount', v_amount,
                              'discount', v_course.price - v_amount);
  end if;
  return jsonb_build_object('valid', null, 'original', v_course.price, 'amount', v_amount);
end $$;

create or replace function public.submit_payment(
  p_course_id uuid, p_method public.payment_method, p_reference text, p_sender_name text,
  p_sender_number text, p_receipt_path text, p_code text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_quote jsonb; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if public.is_enrolled(p_course_id) then raise exception 'You are already enrolled in this course'; end if;
  if length(trim(coalesce(p_reference, ''))) < 4 then raise exception 'Reference number is required'; end if;
  if length(trim(coalesce(p_sender_name, ''))) < 2 then raise exception 'Sender name is required'; end if;
  -- Receipt must live in the caller's own folder.
  if split_part(p_receipt_path, '/', 1) <> auth.uid()::text then raise exception 'Invalid receipt'; end if;

  v_quote := public.quote_price(p_course_id, p_code);
  if p_code is not null and length(trim(p_code)) > 0 and (v_quote ->> 'valid')::boolean is not true then
    raise exception 'Discount code is no longer valid';
  end if;

  insert into public.payments (user_id, course_id, amount, original_amount, discount_code_id, method,
                               reference_number, sender_name, sender_number, receipt_path)
  values (auth.uid(), p_course_id, (v_quote ->> 'amount')::numeric, (v_quote ->> 'original')::numeric,
          nullif(v_quote ->> 'code_id', '')::uuid, p_method, trim(p_reference), trim(p_sender_name),
          trim(coalesce(p_sender_number, '')), p_receipt_path)
  returning id into v_id;
  return v_id;
end $$;

-- Approve => enroll, unlock, progress record, notify. All in one transaction.
create or replace function public.approve_payment(p_payment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_pay public.payments; v_course public.courses;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select * into v_pay from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  if v_pay.status = 'approved' then return; end if;

  update public.payments
     set status = 'approved', approved_at = now(), reviewed_at = now(), reviewed_by = auth.uid(), rejection_reason = null
   where id = p_payment_id;

  insert into public.enrollments (user_id, course_id, status)
  values (v_pay.user_id, v_pay.course_id, 'active')
  on conflict (user_id, course_id) do update set status = 'active';

  if v_pay.discount_code_id is not null then
    update public.discount_codes set uses = uses + 1 where id = v_pay.discount_code_id;
  end if;

  select * into v_course from public.courses where id = v_pay.course_id;
  perform public.notify(v_pay.user_id, 'payment_approved', '🎉 Payment confirmed!',
    'Welcome to the ' || v_course.title || '. Your course is unlocked.', '/courses/' || v_course.slug);
end $$;

create or replace function public.reject_payment(p_payment_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_pay public.payments;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.payments
     set status = 'rejected', rejection_reason = nullif(trim(p_reason), ''), reviewed_at = now(), reviewed_by = auth.uid()
   where id = p_payment_id and status = 'pending'
  returning * into v_pay;
  if not found then raise exception 'Pending payment not found'; end if;
  perform public.notify(v_pay.user_id, 'payment_rejected', 'Payment could not be confirmed',
    coalesce(v_pay.rejection_reason, 'Please review your payment details and resubmit.'), '/payment-status');
end $$;

-- Ordered list of published lessons for a course.
create or replace function public.course_lesson_order(p_course_id uuid)
returns table (lesson_id uuid, idx int) language sql stable security definer set search_path = public as $$
  select l.id, (row_number() over (order by m.position, l.position, l.created_at))::int
  from public.lessons l join public.modules m on m.id = l.module_id
  where l.course_id = p_course_id and l.published;
$$;

-- A lesson is unlocked when every earlier lesson is complete.
create or replace function public.lesson_unlocked(p_lesson_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_course uuid; v_idx int;
begin
  select course_id into v_course from public.lessons where id = p_lesson_id;
  select idx into v_idx from public.course_lesson_order(v_course) where lesson_id = p_lesson_id;
  if v_idx is null then return false; end if;
  return not exists (
    select 1 from public.course_lesson_order(v_course) o
    left join public.lesson_progress lp on lp.lesson_id = o.lesson_id and lp.user_id = auth.uid() and lp.completed
    where o.idx < v_idx and lp.id is null
  );
end $$;

create or replace function public.touch_lesson(p_lesson_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_course uuid;
begin
  select course_id into v_course from public.lessons where id = p_lesson_id;
  if not public.is_enrolled(v_course) then return; end if;
  insert into public.lesson_progress (user_id, lesson_id, course_id, last_viewed_at)
  values (auth.uid(), p_lesson_id, v_course, now())
  on conflict (user_id, lesson_id) do update set last_viewed_at = now();
  update public.enrollments set last_lesson_id = p_lesson_id, last_viewed_at = now()
   where user_id = auth.uid() and course_id = v_course;
  update public.profiles set last_active_at = now() where id = auth.uid();
end $$;

create or replace function public.complete_lesson(p_lesson_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_course uuid; v_total int; v_done int; v_pct int; v_prev_pct int; v_next uuid; v_idx int; v_slug text;
begin
  select course_id into v_course from public.lessons where id = p_lesson_id and published;
  if v_course is null then raise exception 'Lesson not found'; end if;
  if not public.is_enrolled(v_course) then raise exception 'Not enrolled'; end if;
  if not public.lesson_unlocked(p_lesson_id) then raise exception 'Complete the previous lessons first'; end if;

  insert into public.lesson_progress (user_id, lesson_id, course_id, completed, completed_at)
  values (auth.uid(), p_lesson_id, v_course, true, now())
  on conflict (user_id, lesson_id) do update set completed = true, completed_at = coalesce(public.lesson_progress.completed_at, now());

  select count(*) into v_total from public.course_lesson_order(v_course);
  select count(*) into v_done from public.lesson_progress lp
    join public.course_lesson_order(v_course) o on o.lesson_id = lp.lesson_id
   where lp.user_id = auth.uid() and lp.completed;
  v_pct := case when v_total = 0 then 0 else floor(v_done * 100.0 / v_total) end;

  select progress_percent into v_prev_pct from public.enrollments where user_id = auth.uid() and course_id = v_course;
  update public.enrollments
     set progress_percent = v_pct, last_lesson_id = p_lesson_id, last_viewed_at = now(),
         status = case when v_pct = 100 then 'completed'::public.enrollment_status else status end,
         completed_at = case when v_pct = 100 then coalesce(completed_at, now()) else completed_at end
   where user_id = auth.uid() and course_id = v_course;

  select slug into v_slug from public.courses where id = v_course;
  if v_prev_pct < 50 and v_pct >= 50 and v_pct < 100 then
    perform public.notify(auth.uid(), 'milestone', '🔥 Halfway there!', 'You are 50% through the course. Keep creating.', '/courses/' || v_slug);
  elsif v_prev_pct < 100 and v_pct = 100 then
    perform public.notify(auth.uid(), 'milestone', '🎉 Course completed!', 'Congratulations — you finished the masterclass.', '/courses/' || v_slug || '/complete');
  end if;

  select idx into v_idx from public.course_lesson_order(v_course) where lesson_id = p_lesson_id;
  select lesson_id into v_next from public.course_lesson_order(v_course) where idx = v_idx + 1;

  return jsonb_build_object('percent', v_pct, 'completed', v_done, 'total', v_total,
                            'next_lesson_id', v_next, 'course_completed', v_pct = 100);
end $$;

-- Challenge submission: creates a Bottle post with a challenge badge.
create or replace function public.submit_challenge(
  p_challenge_id uuid, p_day int, p_video_url text, p_video_path text, p_caption text, p_explanation text, p_tags text[])
returns uuid language plpgsql security definer set search_path = public as $$
declare v_ch public.challenges; v_post uuid; v_count int;
begin
  if not public.has_access() then raise exception 'Enroll in the masterclass to join challenges'; end if;
  select * into v_ch from public.challenges where id = p_challenge_id and status = 'active';
  if not found then raise exception 'Challenge is not active'; end if;
  if p_day < 1 or p_day > v_ch.days then raise exception 'Invalid day'; end if;
  if p_video_path is not null and split_part(p_video_path, '/', 1) <> auth.uid()::text then raise exception 'Invalid upload'; end if;

  insert into public.challenge_participants (challenge_id, user_id) values (p_challenge_id, auth.uid())
  on conflict do nothing;

  insert into public.posts (user_id, video_url, video_path, caption, tags, challenge_id)
  values (auth.uid(), p_video_url, p_video_path, coalesce(p_caption, ''), coalesce(p_tags, '{}'), p_challenge_id)
  returning id into v_post;

  insert into public.challenge_submissions (challenge_id, user_id, post_id, day, explanation)
  values (p_challenge_id, auth.uid(), v_post, p_day, coalesce(p_explanation, ''));

  select count(*) into v_count from public.challenge_submissions where challenge_id = p_challenge_id and user_id = auth.uid();
  if v_count >= v_ch.days then
    update public.challenge_participants set completed_at = coalesce(completed_at, now())
     where challenge_id = p_challenge_id and user_id = auth.uid();
    perform public.notify(auth.uid(), 'challenge', '🏁 Challenge complete!', 'You finished ' || v_ch.title || '.', '/challenges/' || p_challenge_id);
  end if;
  return v_post;
end $$;

-- Weekly creator leaderboard (multi-signal, not likes only).
create or replace function public.weekly_leaderboard(p_limit int default 10)
returns table (user_id uuid, full_name text, avatar_url text, score int, likes int, posts int, submissions int, comments int, featured int)
language sql stable security definer set search_path = public as $$
  with since as (select date_trunc('week', now()) as t),
  l as (select p.user_id, count(*) n from public.likes k join public.posts p on p.id = k.post_id, since
        where k.created_at >= since.t and p.status = 'published' group by 1),
  po as (select user_id, count(*) n, count(*) filter (where featured) f from public.posts, since
         where created_at >= since.t and status = 'published' group by 1),
  s as (select user_id, count(*) n from public.challenge_submissions, since where created_at >= since.t group by 1),
  c as (select user_id, count(*) n from (
          select user_id, created_at from public.comments
          union all select user_id, created_at from public.community_comments) x, since
        where x.created_at >= since.t group by 1)
  select pr.id, pr.full_name, pr.avatar_url,
         (coalesce(l.n,0) * 1 + coalesce(po.n,0) * 5 + coalesce(s.n,0) * 10 + coalesce(c.n,0) * 2 + coalesce(po.f,0) * 25)::int,
         coalesce(l.n,0)::int, coalesce(po.n,0)::int, coalesce(s.n,0)::int, coalesce(c.n,0)::int, coalesce(po.f,0)::int
  from public.profiles pr
  left join l on l.user_id = pr.id left join po on po.user_id = pr.id
  left join s on s.user_id = pr.id left join c on c.user_id = pr.id
  where pr.role = 'student' and pr.status = 'active'
    and (coalesce(l.n,0) + coalesce(po.n,0) + coalesce(s.n,0) + coalesce(c.n,0)) > 0
  order by 4 desc, 5 desc
  limit p_limit;
$$;

create or replace function public.creator_stats(p_user uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'videos', (select count(*) from public.posts where user_id = p_user and status = 'published'),
    'likes', (select coalesce(sum(like_count), 0) from public.posts where user_id = p_user and status = 'published'),
    'challenges', (select count(*) from public.challenge_participants where user_id = p_user and completed_at is not null),
    'lessons', (select count(*) from public.lesson_progress where user_id = p_user and completed)
  );
$$;

-- Admin: students with emails (emails are not exposed in public.profiles)
create or replace function public.admin_students()
returns table (id uuid, full_name text, email text, avatar_url text, status public.account_status, role public.user_role,
               created_at timestamptz, last_active_at timestamptz, progress int, enrolled boolean, payment_status text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return query
  select p.id, p.full_name, u.email::text, p.avatar_url, p.status, p.role, p.created_at, p.last_active_at,
         coalesce(max(e.progress_percent), 0)::int, bool_or(e.id is not null) is true,
         (select pa.status::text from public.payments pa where pa.user_id = p.id order by pa.submitted_at desc limit 1)
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.enrollments e on e.user_id = p.id
  group by p.id, u.email
  order by p.created_at desc;
end $$;

create or replace function public.admin_payments()
returns table (id uuid, user_id uuid, full_name text, email text, course_title text, amount numeric, original_amount numeric,
               method public.payment_method, reference_number text, sender_name text, sender_number text, receipt_path text,
               status public.payment_status, rejection_reason text, submitted_at timestamptz, approved_at timestamptz, discount_code text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return query
  select pa.id, pa.user_id, p.full_name, u.email::text, c.title, pa.amount, pa.original_amount, pa.method, pa.reference_number,
         pa.sender_name, pa.sender_number, pa.receipt_path, pa.status, pa.rejection_reason, pa.submitted_at, pa.approved_at, d.code
  from public.payments pa
  join public.profiles p on p.id = pa.user_id
  join auth.users u on u.id = pa.user_id
  join public.courses c on c.id = pa.course_id
  left join public.discount_codes d on d.id = pa.discount_code_id
  order by pa.submitted_at desc;
end $$;

create or replace function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select jsonb_build_object(
    'total_students', (select count(*) from public.profiles where role = 'student'),
    'new_students_7d', (select count(*) from public.profiles where role = 'student' and created_at > now() - interval '7 days'),
    'active_students', (select count(*) from public.profiles where role = 'student' and last_active_at > now() - interval '14 days'),
    'enrolled_students', (select count(distinct user_id) from public.enrollments),
    'pending_payments', (select count(*) from public.payments where status = 'pending'),
    'approved_payments', (select count(*) from public.payments where status = 'approved'),
    'rejected_payments', (select count(*) from public.payments where status = 'rejected'),
    'total_sales', (select coalesce(sum(amount), 0) from public.payments where status = 'approved'),
    'sales_30d', (select coalesce(sum(amount), 0) from public.payments where status = 'approved' and approved_at > now() - interval '30 days'),
    'avg_progress', (select coalesce(round(avg(progress_percent)), 0) from public.enrollments),
    'completion_rate', (select coalesce(round(100.0 * count(*) filter (where progress_percent = 100) / nullif(count(*), 0)), 0) from public.enrollments),
    'bottle_posts', (select count(*) from public.posts),
    'comments', (select count(*) from public.comments) + (select count(*) from public.community_comments),
    'likes', (select count(*) from public.likes),
    'active_creators', (select count(distinct user_id) from public.posts where created_at > now() - interval '30 days'),
    'lesson_stats', (
      select coalesce(jsonb_agg(x order by x.idx), '[]'::jsonb) from (
        select o.idx, l.title, count(lp.id) filter (where lp.completed) as completions,
               count(lp.id) as views
        from public.courses c
        cross join lateral public.course_lesson_order(c.id) o
        join public.lessons l on l.id = o.lesson_id
        left join public.lesson_progress lp on lp.lesson_id = l.id
        group by o.idx, l.title, c.created_at
        order by c.created_at, o.idx
      ) x),
    'sales_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'amount', coalesce(s.amount, 0)) order by d), '[]'::jsonb)
      from generate_series(current_date - 13, current_date, interval '1 day') d
      left join (select approved_at::date as day, sum(amount) amount from public.payments where status = 'approved' group by 1) s
        on s.day = d::date)
  ) into v;
  return v;
end $$;

create or replace function public.admin_broadcast(p_content text)
returns int language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  insert into public.messages (sender_id, recipient_id, content)
  select auth.uid(), p.id, p_content from public.profiles p where p.role = 'student' and p.status = 'active';
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- =====================================================================
-- Row level security
-- =====================================================================
alter table public.profiles               enable row level security;
alter table public.courses                enable row level security;
alter table public.modules                enable row level security;
alter table public.lessons                enable row level security;
alter table public.lesson_content         enable row level security;
alter table public.lesson_resources       enable row level security;
alter table public.enrollments            enable row level security;
alter table public.lesson_progress        enable row level security;
alter table public.lesson_notes           enable row level security;
alter table public.discount_codes         enable row level security;
alter table public.payments               enable row level security;
alter table public.challenges             enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.posts                  enable row level security;
alter table public.likes                  enable row level security;
alter table public.comments               enable row level security;
alter table public.challenge_submissions  enable row level security;
alter table public.community_posts        enable row level security;
alter table public.community_comments     enable row level security;
alter table public.community_likes        enable row level security;
alter table public.announcements          enable row level security;
alter table public.notifications          enable row level security;
alter table public.messages               enable row level security;

-- profiles
create policy "profiles readable" on public.profiles for select using (true);
create policy "profiles self update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- catalog
create policy "courses readable" on public.courses for select using (published or public.is_admin());
create policy "courses admin" on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "modules readable" on public.modules for select
  using (public.is_admin() or exists (select 1 from public.courses c where c.id = course_id and c.published));
create policy "modules admin" on public.modules for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "lessons readable" on public.lessons for select
  using (public.is_admin() or (published and exists (select 1 from public.courses c where c.id = course_id and c.published)));
create policy "lessons admin" on public.lessons for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- paid content (enrollment gated)
create policy "lesson content enrolled" on public.lesson_content for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.lessons l where l.id = lesson_id and l.published
      and (l.is_preview or public.is_enrolled(l.course_id))));
create policy "lesson content admin" on public.lesson_content for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "resources enrolled" on public.lesson_resources for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.lessons l where l.id = lesson_id and l.published
      and (l.is_preview or public.is_enrolled(l.course_id))));
create policy "resources admin" on public.lesson_resources for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- enrollment & progress (writes only through security-definer RPCs)
create policy "enrollments own" on public.enrollments for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "enrollments admin" on public.enrollments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "progress own" on public.lesson_progress for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "notes own" on public.lesson_notes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- commerce
create policy "discounts admin" on public.discount_codes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "payments own" on public.payments for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- challenges
create policy "challenges readable" on public.challenges for select to authenticated using (status <> 'draft' or public.is_admin());
create policy "challenges admin" on public.challenges for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "participants readable" on public.challenge_participants for select to authenticated using (true);
create policy "participants join" on public.challenge_participants for insert to authenticated
  with check (user_id = auth.uid() and public.has_access());
create policy "participants leave" on public.challenge_participants for delete to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "submissions readable" on public.challenge_submissions for select to authenticated using (true);
create policy "submissions admin" on public.challenge_submissions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "submissions delete" on public.challenge_submissions for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- bottle
create policy "posts readable" on public.posts for select using (
  (status = 'published' and (auth.uid() is not null or featured)) or user_id = auth.uid() or public.is_admin());
create policy "posts create" on public.posts for insert to authenticated
  with check (user_id = auth.uid() and public.has_access() and status = 'published' and not featured and not pinned);
create policy "posts update" on public.posts for update to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "posts delete" on public.posts for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "likes readable" on public.likes for select to authenticated using (true);
create policy "likes create" on public.likes for insert to authenticated with check (user_id = auth.uid() and public.has_access());
create policy "likes delete" on public.likes for delete to authenticated using (user_id = auth.uid());

create policy "comments readable" on public.comments for select to authenticated using (true);
create policy "comments create" on public.comments for insert to authenticated with check (user_id = auth.uid() and public.has_access());
create policy "comments delete" on public.comments for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- community
create policy "community readable" on public.community_posts for select to authenticated using (true);
create policy "community create" on public.community_posts for insert to authenticated
  with check (user_id = auth.uid() and public.has_access() and not pinned);
create policy "community update" on public.community_posts for update to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "community delete" on public.community_posts for delete to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "ccomments readable" on public.community_comments for select to authenticated using (true);
create policy "ccomments create" on public.community_comments for insert to authenticated with check (user_id = auth.uid() and public.has_access());
create policy "ccomments delete" on public.community_comments for delete to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "clikes readable" on public.community_likes for select to authenticated using (true);
create policy "clikes create" on public.community_likes for insert to authenticated with check (user_id = auth.uid() and public.has_access());
create policy "clikes delete" on public.community_likes for delete to authenticated using (user_id = auth.uid());

-- announcements / notifications / messages
create policy "announcements readable" on public.announcements for select to authenticated using (publish_at <= now() or public.is_admin());
create policy "announcements admin" on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "notifications own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications own update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications own delete" on public.notifications for delete to authenticated using (user_id = auth.uid());

create policy "messages participants" on public.messages for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "messages send" on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and (
    public.is_admin()
    or exists (select 1 from public.profiles p where p.id = recipient_id and p.role = 'admin')));
create policy "messages mark read" on public.messages for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- RPC grants (definer functions perform their own checks)
revoke execute on function public.admin_students() from anon;
revoke execute on function public.admin_payments() from anon;
revoke execute on function public.admin_overview() from anon;
revoke execute on function public.admin_broadcast(text) from anon;
revoke execute on function public.approve_payment(uuid) from anon;
revoke execute on function public.reject_payment(uuid, text) from anon;

-- =====================================================================
-- Storage
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  -- 50 MB = Supabase free-plan per-file maximum. Raise after upgrading (Pro allows much larger files).
  ('course-media', 'course-media', false, 52428800,  null),                       -- lesson videos + downloads (private)
  ('receipts',     'receipts',     false, 10485760,  array['image/png','image/jpeg','image/webp','image/heic','application/pdf']),
  ('bottle',       'bottle',       true,  52428800,  array['video/mp4','video/quicktime','video/webm','image/jpeg','image/png','image/webp']),
  ('avatars',      'avatars',      true,  5242880,   array['image/png','image/jpeg','image/webp']),
  ('public-assets','public-assets',true,  52428800,  null)
on conflict (id) do nothing;

-- course-media: path = {course_id}/{...}; readable (signed URLs) only by enrolled students
create policy "course media read" on storage.objects for select to authenticated using (
  bucket_id = 'course-media' and (
    public.is_admin()
    or ((storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' and public.is_enrolled(((storage.foldername(name))[1])::uuid))));
create policy "course media admin write" on storage.objects for insert to authenticated with check (bucket_id = 'course-media' and public.is_admin());
create policy "course media admin update" on storage.objects for update to authenticated using (bucket_id = 'course-media' and public.is_admin());
create policy "course media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'course-media' and public.is_admin());

-- receipts: path = {user_id}/{file}
create policy "receipts own upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "receipts own or admin read" on storage.objects for select to authenticated using (
  bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- bottle videos: path = {user_id}/{file}
create policy "bottle own upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'bottle' and (storage.foldername(name))[1] = auth.uid()::text and public.has_access());
create policy "bottle own delete" on storage.objects for delete to authenticated using (
  bucket_id = 'bottle' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- avatars: path = {user_id}/{file}
create policy "avatars own write" on storage.objects for insert to authenticated with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars own update" on storage.objects for update to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- public assets (thumbnails, announcement images, challenge references): admin only
create policy "public assets admin write" on storage.objects for insert to authenticated with check (bucket_id = 'public-assets' and public.is_admin());
create policy "public assets admin delete" on storage.objects for delete to authenticated using (bucket_id = 'public-assets' and public.is_admin());

-- Realtime for live notification badge
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
