import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { loadCourse } from "@/lib/course";
import { ModuleList } from "@/components/course/ModuleList";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CompleteButton, LessonNotes, LessonResources } from "@/components/course/LessonClient";
import type { LessonResource } from "@/lib/types";
import { lessonCode } from "@/lib/utils";

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await params;
  const { supabase, user } = await requireUser();
  const data = await loadCourse(supabase, slug, user.id);
  if (!data) notFound();
  const i = data.flat.findIndex((l) => l.id === lessonId);
  if (i < 0) notFound();
  const lesson = data.flat[i];
  if (lesson.state === "locked") redirect(data.enrolled ? `/courses/${slug}/${data.nextLesson?.id}` : `/courses/${slug}`);

  // RLS returns content only for enrolled students (or preview lessons).
  const [{ data: content }, { data: resources }, { data: note }] = await Promise.all([
    supabase.from("lesson_content").select("*").eq("lesson_id", lessonId).maybeSingle(),
    supabase.from("lesson_resources").select("*").eq("lesson_id", lessonId).order("position"),
    supabase.from("lesson_notes").select("content").eq("lesson_id", lessonId).eq("user_id", user.id).maybeSingle(),
    data.enrolled ? supabase.rpc("touch_lesson", { p_lesson_id: lessonId }) : Promise.resolve(null),
  ]);

  // Private bucket → short-lived signed URL, generated per request for enrolled viewers only.
  let videoSrc: string | null = content?.video_url ?? null;
  if (content?.video_path) {
    const { data: signed } = await supabase.storage.from("course-media").createSignedUrl(content.video_path, 60 * 60 * 3);
    videoSrc = signed?.signedUrl ?? videoSrc;
  }
  const res = await Promise.all(((resources ?? []) as LessonResource[]).map(async (r) => {
    if (r.file_path) {
      const { data: s } = await supabase.storage.from("course-media").createSignedUrl(r.file_path, 60 * 60, { download: true });
      return { ...r, href: s?.signedUrl ?? null };
    }
    return { ...r, href: r.url };
  }));

  const prev = data.flat[i - 1];
  const next = data.flat[i + 1];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <Link href={`/courses/${slug}`} className="mb-4 inline-flex items-center gap-1 text-sm text-mute hover:text-white"><ChevronLeft className="size-4" />{data.course.title}</Link>
        <p className="text-[11px] font-bold tracking-[0.2em] text-accent">{lessonCode(lesson.moduleIndex, lesson.lessonIndex)}</p>
        <h1 className="h-display mt-2 text-[34px] leading-tight md:text-5xl">{lesson.title}</h1>

        <div className="relative -mx-4 mt-5 aspect-video overflow-hidden bg-black md:mx-0 md:rounded-2xl md:border md:border-line">
          {videoSrc ? (
            <video key={lessonId} src={videoSrc} controls playsInline preload="metadata" controlsList="nodownload"
              onContextMenu={undefined} poster={lesson.thumbnail_url ?? undefined} className="size-full" />
          ) : (
            <div className="grid size-full place-items-center text-sm text-mute"><span className="flex items-center gap-2"><Lock className="size-4" /> Video unavailable</span></div>
          )}
        </div>

        <div className="mt-6">
          {data.enrolled
            ? <CompleteButton lessonId={lessonId} slug={slug} completed={lesson.state === "completed"} nextId={next?.id ?? null} />
            : <Link href={`/checkout/${slug}`} className="btn-primary h-13 w-full">Unlock the full masterclass</Link>}
        </div>

        <section className="mt-8">
          <h2 className="label">Lesson description</h2>
          <div className="whitespace-pre-line text-[15px] leading-relaxed text-soft">{content?.body || lesson.description}</div>
        </section>

        <section className="mt-8">
          <h2 className="label mb-3">Lesson resources</h2>
          <LessonResources resources={res} />
        </section>

        <section className="mt-8">
          <h2 className="label mb-3">Your notes</h2>
          <LessonNotes lessonId={lessonId} initial={note?.content ?? ""} />
        </section>

        <nav className="mt-10 grid grid-cols-2 gap-3 border-t border-line pt-6">
          {prev && prev.state !== "locked" ? (
            <Link href={`/courses/${slug}/${prev.id}`} className="glass glass-hover p-4 text-sm">
              <span className="flex items-center gap-1 text-xs text-mute"><ChevronLeft className="size-3.5" /> Previous</span>
              <span className="mt-1 block truncate font-medium">{prev.title}</span>
            </Link>
          ) : <span />}
          {next && (
            <Link href={next.state === "locked" ? "#" : `/courses/${slug}/${next.id}`} aria-disabled={next.state === "locked"}
              className={`glass p-4 text-right text-sm ${next.state === "locked" ? "pointer-events-none opacity-50" : "glass-hover"}`}>
              <span className="flex items-center justify-end gap-1 text-xs text-mute">{next.state === "locked" && <Lock className="size-3" />} Next <ChevronRight className="size-3.5" /></span>
              <span className="mt-1 block truncate font-medium">{next.title}</span>
            </Link>
          )}
        </nav>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-7rem)] xl:self-start xl:overflow-y-auto xl:pr-1">
        {data.enrolled && (
          <div className="glass p-4">
            <div className="flex items-center justify-between text-xs"><span className="font-semibold">Course Progress</span><span className="text-mute">{data.percent}%</span></div>
            <ProgressBar value={data.percent} className="mt-2" />
            <p className="mt-2 text-xs text-mute">{data.completedCount} / {data.total} lessons completed</p>
          </div>
        )}
        <ModuleList outline={data.outline} slug={slug} currentId={lessonId} compact />
      </aside>
    </div>
  );
}
