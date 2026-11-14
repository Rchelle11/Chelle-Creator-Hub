import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Trophy, Clapperboard, Clock, PartyPopper, AlertTriangle, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { loadCourse } from "@/lib/course";
import { ProgressBar, ProgressRing } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Home" };

export default async function Dashboard() {
  const { supabase, user, profile } = await requireUser();
  const [{ data: enrollments }, { count: lessonsDone }, { count: challenges }, { count: posts }, { data: lastPayment }, { data: featured }] = await Promise.all([
    supabase.from("enrollments").select("*, course:courses(slug, title)").eq("user_id", user.id).order("last_viewed_at", { ascending: false, nullsFirst: false }),
    supabase.from("lesson_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true),
    supabase.from("challenge_participants").select("challenge_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("payments").select("status, rejection_reason, approved_at").eq("user_id", user.id).order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("posts").select("id, video_url, poster_url, caption, author:profiles!posts_user_id_fkey(full_name)").eq("featured", true).eq("status", "published").order("created_at", { ascending: false }).limit(3),
  ]);

  const current = enrollments?.[0] as { course: { slug: string; title: string } } | undefined;
  const data = current ? await loadCourse(supabase, current.course.slug, user.id) : null;
  const firstName = profile.full_name.split(" ")[0];
  const justApproved = lastPayment?.status === "approved" && data && data.completedCount === 0 && Number(data.course.price) > 0;

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="animate-fade-up">
        <p className="eyebrow mb-2">Welcome back</p>
        <h1 className="h-display text-[40px] leading-none md:text-6xl">Hi, {firstName}.</h1>
        <p className="mt-2 text-mute">Your studio is ready.</p>
      </header>

      {justApproved && (
        <div className="relative overflow-hidden rounded-2xl border border-ok/25 bg-gradient-to-br from-ok/15 to-transparent p-5 md:p-6">
          <PartyPopper className="mb-3 size-7 text-ok" />
          <h2 className="text-xl font-semibold">🎉 Payment confirmed!</h2>
          <p className="mt-1 text-sm text-soft">Welcome to the {data!.course.title}.</p>
          <Link href={`/courses/${data!.course.slug}/${data!.nextLesson?.id}`} className="btn-primary mt-4">Start Learning <ArrowRight className="size-4" /></Link>
        </div>
      )}
      {lastPayment?.status === "pending" && (
        <Link href="/payment-status" className="flex items-center gap-3 rounded-2xl border border-warn/25 bg-warn/10 p-4 text-sm">
          <Clock className="size-5 shrink-0 text-warn" />
          <span className="flex-1"><b>Payment under review.</b> You&apos;ll get access once it&apos;s confirmed.</span>
          <ArrowRight className="size-4 text-warn" />
        </Link>
      )}
      {lastPayment?.status === "rejected" && !data && (
        <Link href="/payment-status" className="flex items-center gap-3 rounded-2xl border border-bad/25 bg-bad/10 p-4 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-bad" />
          <span className="flex-1"><b>Payment needs attention.</b> {lastPayment.rejection_reason}</span>
          <ArrowRight className="size-4 text-bad" />
        </Link>
      )}

      {data ? (
        <section className="glass relative overflow-hidden p-5 md:p-7">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-accent/15 blur-3xl" />
          <p className="eyebrow relative">Continue learning</p>
          <div className="relative mt-3 flex items-center gap-5">
            <div className="relative hidden sm:block">
              <ProgressRing value={data.percent} size={84} />
              <span className="absolute inset-0 grid place-items-center text-sm font-semibold">{data.percent}%</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="h-display text-3xl md:text-4xl">{data.course.title}</h2>
              {data.nextLesson && <p className="mt-1 truncate text-sm text-mute">Up next: {data.nextLesson.title}</p>}
            </div>
          </div>
          <div className="relative mt-5 flex items-center justify-between text-xs">
            <span className="font-semibold">{data.percent}% Complete</span>
            <span className="text-mute">{data.completedCount} / {data.total} lessons</span>
          </div>
          <ProgressBar value={data.percent} className="relative mt-2" />
          {data.percent === 100 ? (
            <Link href={`/courses/${data.course.slug}/complete`} className="btn-primary relative mt-5 w-full sm:w-fit"><Sparkles className="size-4" /> View Your Achievement</Link>
          ) : (
            <Link href={`/courses/${data.course.slug}/${data.nextLesson?.id}`} className="btn-primary relative mt-5 w-full sm:w-fit">Continue Learning <ArrowRight className="size-4" /></Link>
          )}
        </section>
      ) : lastPayment?.status !== "pending" ? (
        <EmptyState icon={BookOpen} title="Your learning journey starts here." body="Unlock the Short Video Masterclass to start creating." cta="Explore Courses" href="/courses" />
      ) : null}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Courses" value={enrollments?.length ?? 0} icon={<BookOpen className="size-4" />} />
        <StatCard label="Lessons Completed" value={lessonsDone ?? 0} icon={<CheckCircle2 className="size-4" />} />
        <StatCard label="Challenges" value={challenges ?? 0} icon={<Trophy className="size-4" />} />
        <StatCard label="Videos Posted" value={posts ?? 0} icon={<Clapperboard className="size-4" />} />
      </section>

      {!!featured?.length && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-semibold">Featured Creators</h2>
            <Link href="/battles" className="text-sm font-semibold text-accent">Open Battles →</Link>
          </div>
          <div className="grid grid-cols-3 gap-2.5 md:gap-4">
            {(featured as unknown as { id: string; video_url: string; poster_url: string | null; caption: string; author: { full_name: string } | null }[]).map((p) => (
              <Link key={p.id} href={`/battles/${p.id}`} className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-line bg-ink-3">
                <video src={p.video_url} poster={p.poster_url ?? undefined} muted playsInline preload="metadata" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-2.5 pt-10 text-[11px] font-semibold md:p-4 md:text-sm">{p.author?.full_name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
