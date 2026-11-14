import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { loadCourse } from "@/lib/course";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ModuleList } from "@/components/course/ModuleList";
import { Avatar } from "@/components/ui/Avatar";
import { peso } from "@/lib/utils";
import { EnrollFreeButton } from "@/components/course/EnrollFreeButton";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, user } = await requireUser();
  const data = await loadCourse(supabase, slug, user.id);
  if (!data) notFound();
  const { course, outline, enrolled, percent, completedCount, total, nextLesson } = data;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-line">
          {course.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnail_url} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
          )}
          <div className="relative bg-gradient-to-t from-ink via-ink/80 to-ink/30 p-6 pt-24 md:p-10 md:pt-40">
            <p className="eyebrow">{Number(course.price) === 0 ? "Free tutorials" : "Masterclass"}</p>
            <h1 className="h-display mt-2 text-[40px] uppercase leading-none md:text-6xl">{course.title}</h1>
            <p className="mt-4 max-w-xl text-sm text-soft md:text-base">{course.description}</p>
          </div>
        </section>
        <ModuleList outline={outline} slug={course.slug} />
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="glass p-5">
          {enrolled ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">Course progress</p>
              <p className="mt-2 text-4xl font-semibold">{percent}%</p>
              <ProgressBar value={percent} className="mt-3" />
              <p className="mt-2 text-xs text-mute">{completedCount} / {total} lessons completed</p>
              {percent === 100
                ? <Link href={`/courses/${slug}/complete`} className="btn-primary mt-5 w-full"><Sparkles className="size-4" /> View Your Achievement</Link>
                : <Link href={`/courses/${slug}/${nextLesson?.id}`} className="btn-primary mt-5 w-full">{completedCount ? "Continue Learning" : "Start Learning"} <ArrowRight className="size-4" /></Link>}
            </>
          ) : Number(course.price) === 0 ? (
            <>
              <p className="w-fit rounded-full border border-ok/30 bg-ok/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-ok">FREE</p>
              <p className="mt-3 text-4xl font-semibold">₱0</p>
              <p className="mt-1 text-xs text-mute">Free tutorials · no payment needed</p>
              <EnrollFreeButton courseId={course.id} href={`/courses/${slug}${data.flat[0] ? `/${data.flat[0].id}` : ""}`} className="mt-5 w-full" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-mute"><Lock className="size-4" /> Locked</div>
              <p className="mt-3 text-4xl font-semibold">{peso(course.price)}</p>
              <p className="mt-1 text-xs text-mute">One-time · lifetime access · community</p>
              <Link href={`/checkout/${slug}`} className="btn-primary mt-5 w-full">Unlock the Masterclass <ArrowRight className="size-4" /></Link>
              <p className="mt-3 text-center text-xs text-mute">Free preview lessons are playable now.</p>
            </>
          )}
        </div>
        <div className="glass flex items-center gap-3 p-5">
          <Avatar name={course.instructor_name} size={48} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">Instructor</p>
            <p className="font-semibold">{course.instructor_name}</p>
            {course.instructor_bio && <p className="mt-0.5 text-xs text-mute">{course.instructor_bio}</p>}
          </div>
        </div>
      </aside>
    </div>
  );
}
