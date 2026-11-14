-- =====================================================================
-- ROCHELLE OS — starter content for a LIVE project
-- Run AFTER the setup SQL. Adds the Short Video Masterclass course
-- (5 modules, 16 lessons), resources, 2 challenges, discount codes and a
-- welcome announcement. Creates NO user accounts. Safe to run once.
--
-- Lesson videos are placeholders. Replace them in Admin → Courses →
-- (lesson) → Upload video.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Course
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


insert into public.announcements (title, content) values
 ('Welcome to ROCHELLE OS 🎬', 'The Short Video Masterclass is live. Start with Module 1 and post your first video in Bottle!');
