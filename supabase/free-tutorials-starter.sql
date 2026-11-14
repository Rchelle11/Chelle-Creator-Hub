-- Sample FREE course so the "Free Tutorials" section has content.
-- Edit or replace it in Admin → Courses. Safe to run once.
insert into public.courses (id, slug, title, subtitle, description, thumbnail_url, instructor_name, price, published)
values ('10000000-0000-4000-a000-0000000000f1', 'free-tutorials', 'Free Tutorials',
  'Quick wins you can use today.',
  'Short, free lessons to get you started with short-form video — no payment needed.',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80', 'Rochelle', 0, true);

insert into public.modules (id, course_id, title, description, position) values
 ('20000000-0000-4000-a000-0000000000f1', '10000000-0000-4000-a000-0000000000f1', 'Getting Started', 'Free beginner tutorials.', 1);

insert into public.lessons (id, module_id, course_id, title, description, position, duration_seconds) values
 ('30000000-0000-4000-a000-0000000000f1', '20000000-0000-4000-a000-0000000000f1', '10000000-0000-4000-a000-0000000000f1', '3 Hooks You Can Use Today', 'Three simple hook formulas for your next video.', 1, 300),
 ('30000000-0000-4000-a000-0000000000f2', '20000000-0000-4000-a000-0000000000f1', '10000000-0000-4000-a000-0000000000f1', 'CapCut Basics in 10 Minutes', 'Import, cut, add captions and export.', 2, 600),
 ('30000000-0000-4000-a000-0000000000f3', '20000000-0000-4000-a000-0000000000f1', '10000000-0000-4000-a000-0000000000f1', 'Best Export Settings for Reels & TikTok', 'Keep your uploads sharp on every platform.', 3, 240);

insert into public.lesson_content (lesson_id, video_url, body)
select id, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', description
from public.lessons where course_id = '10000000-0000-4000-a000-0000000000f1';
