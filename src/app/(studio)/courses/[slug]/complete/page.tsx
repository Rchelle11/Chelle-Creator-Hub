import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, Clapperboard, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { loadCourse } from "@/lib/course";
import { fmtDate } from "@/lib/utils";

export default async function CompletePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, user, profile } = await requireUser();
  const data = await loadCourse(supabase, slug, user.id);
  if (!data || data.percent < 100) redirect(`/courses/${slug}`);

  return (
    <div className="mx-auto max-w-2xl py-6 text-center">
      <div className="mx-auto grid size-20 animate-pop place-items-center rounded-3xl bg-gradient-to-br from-accent to-gold shadow-[0_0_80px_-10px_var(--color-accent)]">
        <Award className="size-10 text-white" />
      </div>
      <p className="eyebrow mt-8">🎉 Course completed!</p>
      <h1 className="h-display mt-3 text-5xl md:text-6xl">Congratulations, {profile.full_name.split(" ")[0]}!</h1>
      <p className="mt-4 text-soft">You completed the {data.course.title}.</p>

      {/* Achievement card — certificate generation can plug in here later. */}
      <div className="glass relative mt-10 overflow-hidden p-8 text-left">
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-accent/20 blur-3xl" />
        <p className="text-[10px] font-bold tracking-[0.3em] text-mute">ROCHELLE OS · ACHIEVEMENT</p>
        <p className="h-display mt-6 text-4xl">{profile.full_name}</p>
        <p className="mt-2 text-sm text-soft">has completed all {data.total} lessons of the</p>
        <p className="mt-1 text-lg font-semibold">{data.course.title}</p>
        <p className="mt-8 text-xs text-mute">{data.enrollment?.completed_at ? fmtDate(data.enrollment.completed_at) : fmtDate(new Date().toISOString())} · Instructor: {data.course.instructor_name}</p>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/battles/new" className="btn-primary"><Clapperboard className="size-4" /> Share your best work</Link>
        <Link href="/challenges" className="btn-ghost"><Trophy className="size-4" /> Join a challenge</Link>
      </div>
    </div>
  );
}
