-- =====================================================================
-- Demo data for local development / first deploy.
-- Accounts (password for all: Masterclass123!)
--   admin@rochelle.studio   – admin
--   demo@rochelle.studio    – enrolled student with progress
--   new@rochelle.studio     – registered, not enrolled (test checkout)
--   + 5 enrolled creators with Bottle posts
-- =====================================================================

do $$
declare
  u record;
  v_pw text := crypt('Masterclass123!', gen_salt('bf'));
begin
  for u in select * from (values
    ('00000000-0000-4000-a000-000000000001'::uuid, 'admin@rochelle.studio', 'Rochelle'),
    ('00000000-0000-4000-a000-000000000002'::uuid, 'demo@rochelle.studio',  'Demo Student'),
    ('00000000-0000-4000-a000-000000000003'::uuid, 'maria@rochelle.studio', 'Maria Santos'),
    ('00000000-0000-4000-a000-000000000004'::uuid, 'josh@rochelle.studio',  'Josh Reyes'),
    ('00000000-0000-4000-a000-000000000005'::uuid, 'ana@rochelle.studio',   'Ana Cruz'),
    ('00000000-0000-4000-a000-000000000006'::uuid, 'paolo@rochelle.studio', 'Paolo Garcia'),
    ('00000000-0000-4000-a000-000000000007'::uuid, 'kim@rochelle.studio',   'Kim Villanueva'),
    ('00000000-0000-4000-a000-000000000008'::uuid, 'new@rochelle.studio',   'New Student')
  ) as t(id, email, name)
  loop
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, v_pw, now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', u.name), now() - interval '20 days', now(),
      '', '', '', '')
    on conflict (id) do nothing;

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), u.id, u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', now(), now(), now())
    on conflict do nothing;
  end loop;
end $$;

update public.profiles set role = 'admin', bio = 'Creator, editor and your instructor. Building ROCHELLE OS for the next wave of short-form storytellers.'
 where id = '00000000-0000-4000-a000-000000000001';
update public.profiles set bio = 'Learning to turn ideas into scroll-stopping edits.' where id = '00000000-0000-4000-a000-000000000002';
update public.profiles set bio = 'UGC creator · CapCut addict · Manila' where id = '00000000-0000-4000-a000-000000000003';
update public.profiles set bio = 'Freelance editor for local brands.' where id = '00000000-0000-4000-a000-000000000004';
update public.profiles set bio = 'AI video experiments every week.' where id = '00000000-0000-4000-a000-000000000005';
update public.profiles set bio = 'Social media manager by day, storyteller by night.' where id = '00000000-0000-4000-a000-000000000006';
update public.profiles set bio = 'Small business owner learning to market with Reels.' where id = '00000000-0000-4000-a000-000000000007';

-- ---------------------------------------------------------------------
-- Course
-- ---------------------------------------------------------------------
insert into public.courses (id, slug, title, subtitle, description, thumbnail_url, instructor_name, instructor_bio, price, published)
values ('10000000-0000-4000-a000-000000000001', 'short-video-masterclass', 'Short Video Masterclass',
  'Learn. Create. Edit. Publish.',
  'Learn how to create engaging short-form videos from idea to finished edit — strategy, hooks, storytelling, AI video creation, editing, captions, sound design and publishing.',
  'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=80',
  'Rochelle', 'Short-form video creator and editor helping beginners build real creative skills.', 5499, true);

insert into public.modules (id, course_id, title, description, position) values
 ('20000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', 'Introduction to Short Video Creation', 'Set up your creator mindset and understand the format.', 1),
 ('20000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000001', 'Hooks & Storytelling', 'Win the first three seconds and keep them watching.', 2),
 ('20000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000001', 'AI Video Creation', 'Generate visuals, voice and b-roll with AI tools.', 3),
 ('20000000-0000-4000-a000-000000000004', '10000000-0000-4000-a000-000000000001', 'Editing That Feels Premium', 'Pacing, captions, sound effects and transitions in CapCut.', 4),
 ('20000000-0000-4000-a000-000000000005', '10000000-0000-4000-a000-000000000001', 'Publish, Grow & Monetize', 'Strategy, posting systems and turning skills into income.', 5);

with l(id, module_id, title, description, position, dur, preview) as (values
 ('30000000-0000-4000-a000-000000000001'::uuid, '20000000-0000-4000-a000-000000000001'::uuid, 'Welcome to the Masterclass', 'How this studio works, what you will build, and how to get the most out of every lesson.', 1, 245, true),
 ('30000000-0000-4000-a000-000000000002', '20000000-0000-4000-a000-000000000001', 'What Is Short-Form Video?', 'The anatomy of a short: length, format, pacing and platform differences between TikTok, Reels and Shorts.', 2, 512, false),
 ('30000000-0000-4000-a000-000000000003', '20000000-0000-4000-a000-000000000001', 'Why Short Videos Work', 'Attention, retention and the psychology of the scroll. Why short-form is the highest-leverage skill for creators right now.', 3, 634, false),
 ('30000000-0000-4000-a000-000000000004', '20000000-0000-4000-a000-000000000001', 'Choosing Your Niche', 'Find the overlap between what you love, what you know, and what people search for.', 4, 701, false),
 ('30000000-0000-4000-a000-000000000005', '20000000-0000-4000-a000-000000000002', 'The 3-Second Hook', 'Seven hook formulas that stop the scroll — with examples you can adapt today.', 1, 820, false),
 ('30000000-0000-4000-a000-000000000006', '20000000-0000-4000-a000-000000000002', 'Story Structure for 30 Seconds', 'Hook → tension → payoff. Building micro-stories that feel complete.', 2, 760, false),
 ('30000000-0000-4000-a000-000000000007', '20000000-0000-4000-a000-000000000002', 'Writing Scripts That Sound Human', 'Scripting with rhythm, pauses and personality.', 3, 655, false),
 ('30000000-0000-4000-a000-000000000008', '20000000-0000-4000-a000-000000000003', 'Your AI Video Toolkit', 'The tools, what each is best at, and how to combine them.', 1, 590, false),
 ('30000000-0000-4000-a000-000000000009', '20000000-0000-4000-a000-000000000003', 'Prompting for Cinematic Shots', 'Camera language for AI: lens, light, movement and mood.', 2, 880, false),
 ('30000000-0000-4000-a000-000000000010', '20000000-0000-4000-a000-000000000003', 'Making an AI Product Commercial', 'Full walkthrough from product photo to finished 15-second ad.', 3, 1210, false),
 ('30000000-0000-4000-a000-000000000011', '20000000-0000-4000-a000-000000000004', 'CapCut Workflow Essentials', 'Project setup, timeline habits and shortcuts that save hours.', 1, 940, false),
 ('30000000-0000-4000-a000-000000000012', '20000000-0000-4000-a000-000000000004', 'Captions That Keep Attention', 'Styling, timing and emphasis for animated captions.', 2, 610, false),
 ('30000000-0000-4000-a000-000000000013', '20000000-0000-4000-a000-000000000004', 'Sound Effects & Music', 'Sound design that makes edits feel expensive.', 3, 720, false),
 ('30000000-0000-4000-a000-000000000014', '20000000-0000-4000-a000-000000000004', 'Transitions & Visual Storytelling', 'Match cuts, whips and motivated transitions.', 4, 830, false),
 ('30000000-0000-4000-a000-000000000015', '20000000-0000-4000-a000-000000000005', 'Content Strategy & Posting System', 'Pillars, batching and a weekly system you can keep.', 1, 760, false),
 ('30000000-0000-4000-a000-000000000016', '20000000-0000-4000-a000-000000000005', 'Monetization Paths', 'UGC, freelancing, brand deals and selling your editing skills.', 2, 990, false)
)
insert into public.lessons (id, module_id, course_id, title, description, position, duration_seconds, is_preview)
select id, module_id, '10000000-0000-4000-a000-000000000001', title, description, position, dur, preview from l;

-- Demo lesson video: an external stream URL. In production upload to the private
-- `course-media` bucket (video_path) or use a streaming provider.
insert into public.lesson_content (lesson_id, video_url, body)
select id,
  (array['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
         'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
         'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
         'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'])[1 + (position % 4)],
  description || E'\n\nIn this lesson you will:\n• Understand the core idea and why it matters\n• See a real before/after example\n• Apply it immediately with the downloadable worksheet'
from public.lessons;

insert into public.lesson_resources (lesson_id, kind, title, url, content, position)
select id, 'pdf'::public.resource_kind, 'Lesson Worksheet (PDF)', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', null, 1 from public.lessons
union all
select id, 'prompt', 'AI Prompt', null,
  'You are a short-form video strategist. Write 10 scroll-stopping hooks for a video about [TOPIC] for [AUDIENCE]. Keep each under 12 words.', 2
from public.lessons
union all
select id, 'template', 'CapCut Template', 'https://www.capcut.com/templates', null, 3 from public.lessons where position <= 2;

-- ---------------------------------------------------------------------
-- Enrollments & progress
-- ---------------------------------------------------------------------
insert into public.enrollments (user_id, course_id, status, enrolled_at)
select id, '10000000-0000-4000-a000-000000000001', 'active', now() - interval '14 days'
from public.profiles where id in (
  '00000000-0000-4000-a000-000000000002','00000000-0000-4000-a000-000000000003','00000000-0000-4000-a000-000000000004',
  '00000000-0000-4000-a000-000000000005','00000000-0000-4000-a000-000000000006','00000000-0000-4000-a000-000000000007');

-- first N lessons complete per student
insert into public.lesson_progress (user_id, lesson_id, course_id, completed, completed_at, last_viewed_at)
select e.user_id, l.id, l.course_id, true, now() - (o.idx || ' hours')::interval, now() - (o.idx || ' hours')::interval
from public.enrollments e
join public.course_lesson_order('10000000-0000-4000-a000-000000000001') o on true
join public.lessons l on l.id = o.lesson_id
where o.idx <= case e.user_id
  when '00000000-0000-4000-a000-000000000002' then 6
  when '00000000-0000-4000-a000-000000000003' then 16
  when '00000000-0000-4000-a000-000000000004' then 11
  when '00000000-0000-4000-a000-000000000005' then 9
  when '00000000-0000-4000-a000-000000000006' then 4
  else 2 end;

update public.enrollments e set
  progress_percent = floor(100.0 * (select count(*) from public.lesson_progress lp where lp.user_id = e.user_id and lp.completed) / 16),
  last_lesson_id = (select lp.lesson_id from public.lesson_progress lp where lp.user_id = e.user_id order by lp.completed_at asc limit 1),
  last_viewed_at = now() - interval '1 day';
update public.enrollments set status = 'completed', completed_at = now() - interval '2 days' where progress_percent = 100;

-- Approved payments for enrolled students (sales history)
insert into public.payments (user_id, course_id, amount, original_amount, method, reference_number, sender_name, sender_number,
                             receipt_path, status, submitted_at, reviewed_at, approved_at, reviewed_by)
select e.user_id, e.course_id, 5499, 5499, 'gcash', '10' || (100000000 + row_number() over ())::text, p.full_name, '0917 000 00' || row_number() over (),
       e.user_id || '/demo-receipt.png', 'approved', e.enrolled_at - interval '1 day', e.enrolled_at, e.enrolled_at - (row_number() over () || ' days')::interval,
       '00000000-0000-4000-a000-000000000001'
from public.enrollments e join public.profiles p on p.id = e.user_id;

insert into public.discount_codes (code, course_id, percent_off, max_uses) values
 ('CREATOR20', '10000000-0000-4000-a000-000000000001', 20, 100),
 ('EARLYBIRD', '10000000-0000-4000-a000-000000000001', 10, null);

-- ---------------------------------------------------------------------
-- Challenges
-- ---------------------------------------------------------------------
insert into public.challenges (id, title, description, instructions, cover_url, reference_video_url, days, start_date, end_date, status) values
 ('40000000-0000-4000-a000-000000000001', '7-Day Short Video Challenge', 'Create one short video every day for 7 days.',
  E'1. Post one vertical video (9:16) per day.\n2. Every video needs a hook in the first 3 seconds.\n3. Use captions.\n4. Tag your post with #7DayChallenge.\n5. Leave feedback on at least one other creator''s video each day.',
  'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=1200&q=80',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 7, current_date - 3, current_date + 4, 'active'),
 ('40000000-0000-4000-a000-000000000002', 'AI Product Commercial', 'Turn a single product photo into a 15-second AI commercial.',
  E'1. Pick any product you own.\n2. Generate at least 3 AI shots.\n3. Add music + sound effects.\n4. Keep it under 15 seconds.',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&q=80',
  null, 1, current_date - 1, current_date + 10, 'active');

-- ---------------------------------------------------------------------
-- Bottle posts
-- ---------------------------------------------------------------------
insert into public.posts (id, user_id, video_url, caption, tags, challenge_id, featured, pinned, created_at) values
 ('50000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000003', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'My first AI product commercial! Feedback on the pacing please 🙏', '{AIvideo,UGC,CapCut}', '40000000-0000-4000-a000-000000000002', true, true, now() - interval '5 hours'),
 ('50000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000004', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'Day 3 of the challenge — tried a match cut transition for the first time.', '{VideoEditing,Reels}', '40000000-0000-4000-a000-000000000001', true, false, now() - interval '1 day'),
 ('50000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000005', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'Cinematic AI b-roll test. Prompt in the comments.', '{AIvideo,TikTok}', null, false, false, now() - interval '2 days'),
 ('50000000-0000-4000-a000-000000000004', '00000000-0000-4000-a000-000000000006', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'Caption styling practice from Module 4 ✍️', '{CapCut,Reels}', '40000000-0000-4000-a000-000000000001', false, false, now() - interval '3 days'),
 ('50000000-0000-4000-a000-000000000005', '00000000-0000-4000-a000-000000000007', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'Made a Reel for my café using the hook formulas!', '{UGC,Reels}', null, true, false, now() - interval '4 days'),
 ('50000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000002', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'First edit ever — be gentle 😅', '{VideoEditing}', '40000000-0000-4000-a000-000000000001', false, false, now() - interval '6 days');

insert into public.challenge_participants (challenge_id, user_id, joined_at) values
 ('40000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000002', now() - interval '3 days'),
 ('40000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000004', now() - interval '3 days'),
 ('40000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000006', now() - interval '3 days'),
 ('40000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000003', now() - interval '1 day');

insert into public.challenge_submissions (challenge_id, user_id, post_id, day, explanation) values
 ('40000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000002', '50000000-0000-4000-a000-000000000006', 1, 'Practiced my first hook.'),
 ('40000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000004', '50000000-0000-4000-a000-000000000002', 3, 'Match cut practice.'),
 ('40000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000006', '50000000-0000-4000-a000-000000000004', 1, ''),
 ('40000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000003', '50000000-0000-4000-a000-000000000001', 1, 'Used 4 AI shots.');

-- likes (triggers maintain counters)
insert into public.likes (post_id, user_id)
select p.id, u.id from public.posts p cross join public.profiles u
where u.id <> p.user_id and u.role = 'student' and u.id <> '00000000-0000-4000-a000-000000000008'
  and (hashtext(p.id::text || u.id::text) % 3) <> 0;

insert into public.comments (post_id, user_id, content) values
 ('50000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000004', 'The pacing is 🔥 maybe hold the last shot half a second longer.'),
 ('50000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000001', 'Beautiful lighting in shot 2. Featured! ⭐'),
 ('50000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000003', 'That match cut is so clean!'),
 ('50000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000005', 'Great start! Try adding captions next.');

-- community
insert into public.community_posts (user_id, category, title, body, pinned) values
 ('00000000-0000-4000-a000-000000000001', 'general', 'Welcome to the studio 👋 Introduce yourself!', 'Tell us your name, your niche and what you want to create this month.', true),
 ('00000000-0000-4000-a000-000000000004', 'capcut', 'Best export settings for Reels?', 'I''m getting blurry uploads on IG. What settings are you all using?', false),
 ('00000000-0000-4000-a000-000000000007', 'wins', 'Got my first paid UGC client!', 'Used the portfolio from Module 5. ₱3,000 for 2 videos. Small but it''s a start 🥹', false),
 ('00000000-0000-4000-a000-000000000005', 'ai-video', 'Which AI tool for realistic product shots?', 'Comparing a few tools for product commercials — what has worked for you?', false);

insert into public.community_comments (post_id, user_id, content)
select id, '00000000-0000-4000-a000-000000000003', '1080x1920, 30fps, high bitrate — and upload over wifi!' from public.community_posts where category = 'capcut';
insert into public.community_comments (post_id, user_id, content)
select id, '00000000-0000-4000-a000-000000000001', 'So proud of you! This is exactly how it starts. 👏' from public.community_posts where category = 'wins';

-- announcement (trigger notifies everyone)
insert into public.announcements (title, content, created_by) values
 ('NEW MASTERCLASS UPDATE', 'New lesson added: How to Create Viral Hooks. Find it in Module 2.', '00000000-0000-4000-a000-000000000001');

insert into public.messages (sender_id, recipient_id, content) values
 ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000002', 'Hi! Welcome to the masterclass. Reply here anytime if you get stuck. — Rochelle');

-- A pending payment from the "new" student so the admin queue has something to review
insert into public.payments (user_id, course_id, amount, original_amount, method, reference_number, sender_name, sender_number, receipt_path)
values ('00000000-0000-4000-a000-000000000008', '10000000-0000-4000-a000-000000000001', 5499, 5499, 'gcash', '1029 384 756',
        'New Student', '0917 555 0123', '00000000-0000-4000-a000-000000000008/demo-receipt.png');
