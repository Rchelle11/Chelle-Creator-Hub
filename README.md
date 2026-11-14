# ROCHELLE OS — Short Video Masterclass

A mobile-first creator academy + community: courses with progress tracking, manual GCash/GoTyme/PayPal checkout with admin approval → automatic enrollment, the **Bottle** vertical video feed, challenges, leaderboard, community, announcements, notifications, messages and a full admin dashboard. Installable as a PWA.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, Realtime) · Lucide · Vercel

## Quick start (local)

```bash
npm install
npx supabase start          # needs Docker; applies supabase/migrations + supabase/seed.sql
cp .env.example .env.local  # paste the API URL + publishable/anon key printed by `supabase start`
npm run dev
```

Demo accounts (password `Masterclass123!`):

| Email | Role |
|---|---|
| admin@rochelle.studio | Admin |
| demo@rochelle.studio | Enrolled student with progress |
| new@rochelle.studio | Registered, payment pending |

Discount codes: `CREATOR20` (20% off), `EARLYBIRD` (10% off).

## Deploy (Supabase + Vercel)

1. Create a Supabase project. Run `npx supabase link` and then `npx supabase db push` to apply the migration. **Do not run `seed.sql` in production**, because it creates demo accounts.
2. Optional: run `supabase/starter-content.sql` in the SQL editor to load the course, lessons and challenges (no fake users).
3. Create your admin: sign up in the app, then run `supabase/make-admin.sql` with your email, or:
   `update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');`
4. Supabase → Auth → URL configuration: set Site URL to your domain and add `https://yourdomain/**` to redirect URLs.
5. Import the repo into Vercel. Under **Settings → Environment Variables**, add these (required, or every page that uses the database will fail):
   - `NEXT_PUBLIC_SUPABASE_URL`: e.g. `https://<project-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`): the anon / `sb_publishable_…` key. Never the secret key.

   Optional: GCash/GoTyme details and QR image URLs (`NEXT_PUBLIC_GCASH_QR_URL`, `NEXT_PUBLIC_GOTYME_QR_URL`). See `.env.example` for the full list.

   `NEXT_PUBLIC_*` values are baked in at build time, so **redeploy after changing them**.

## Architecture

```
src/
  app/
    page.tsx                 public landing / sales page
    (auth)/                  login, signup, forgot/reset password (server actions)
    (studio)/                student app: dashboard, courses, lessons, checkout, payment-status,
                             bottle, u/[id] profiles, challenges, community, messages,
                             announcements, notifications, account, search
    admin/                   overview + analytics, payments, students, courses, bottle
                             moderation, challenges, announcements, messages, discounts
  components/                ui/ (Modal, Toast, ProgressBar, Avatar, EmptyState…), nav/,
                             course/, bottle/, challenges/, checkout/, community/, admin/
  lib/
    actions/                 server actions (student + admin, separated)
    supabase/                browser/server clients + session proxy
    course.ts                course outline, lock state and progress loader
    upload.ts                direct-to-Storage uploads with progress, image compression, video posters
  proxy.ts                   route protection + session refresh
supabase/
  migrations/                schema, RLS, storage policies, RPC business logic
  seed.sql                   demo data
```

### Security model
Security is enforced in Postgres, not only in the UI.
- **RLS on every table.** Paid lesson content (`lesson_content`, `lesson_resources`) is readable only by enrolled students, admins, or for free-preview lessons. Lesson titles stay public so the outline can be shown.
- **Course videos** live in the private `course-media` bucket. Pages request short-lived signed URLs, and the storage policy checks enrollment from the path (`{course_id}/…`).
- **Receipts** live in the private `receipts` bucket (`{user_id}/…`). Only the owner and admins can read them.
- **Prices are computed server-side** (`quote_price` / `submit_payment`). Clients cannot set amounts.
- **Approval is one transaction** (`approve_payment`): it marks the payment approved, upserts the enrollment (which is the progress record), counts the discount use and notifies the student.
- **Sequential unlocking** is enforced by `complete_lesson`, which refuses a lesson until the previous ones are done.
- Students cannot change their own role or status, or feature or pin their own posts (trigger guards).
- Emails are never exposed in `profiles`. Admins read them through `admin_*` security-definer RPCs.

### Notifications
Database triggers create notifications for payment approval or rejection, new lessons, announcements, comments, replies, likes, featured videos, challenge completion, course milestones and messages. The bell updates live through Supabase Realtime.

### Leaderboard
`weekly_leaderboard()` scores the current week with several signals: challenge entry 10, video 5, comment 2, like 1, featured 25.

## Production notes / next steps
- **Video:** Bottle uploads go straight to Storage with a progress bar, a generated poster frame and lazy loading (`preload="none"` until near the viewport). At scale, put Bottle and course video on a streaming provider (Mux, Cloudflare Stream or Bunny) for HLS and server-side transcoding. Lessons already accept an external `video_url`.
- **Email:** wire Supabase Auth SMTP and a provider (e.g. Resend) to the `notifications` table for email delivery.
- **Built to extend:** certificates (the completion page has an achievement card ready), payment gateway (swap `submit_payment` for a webhook that calls the same enrollment logic), multiple courses and tiers (schema already supports them), AI tools, and affiliates.
