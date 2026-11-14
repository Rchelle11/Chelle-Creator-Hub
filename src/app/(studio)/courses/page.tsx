import { BookOpen, Gift } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { loadCourse } from "@/lib/course";
import { PageHeader } from "@/components/ui/PageHeader";
import { CourseCard } from "@/components/course/CourseCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Courses" };

export default async function CoursesPage() {
  const { supabase, user } = await requireUser();
  const { data: courses } = await supabase.from("courses").select("slug").eq("published", true).order("created_at");
  const loaded = (await Promise.all((courses ?? []).map((c) => loadCourse(supabase, c.slug, user.id)))).filter(Boolean);
  const mine = loaded.filter((c) => c!.enrolled);
  const free = loaded.filter((c) => !c!.enrolled && Number(c!.course.price) === 0);
  const paid = loaded.filter((c) => !c!.enrolled && Number(c!.course.price) > 0);
  const card = (c: (typeof loaded)[number], enrolled: boolean) => (
    <CourseCard key={c!.course.id} courseId={c!.course.id} price={Number(c!.course.price)} slug={c!.course.slug} title={c!.course.title}
      description={c!.course.description} thumbnail={c!.course.thumbnail_url} modules={c!.outline.length} lessons={c!.total}
      percent={enrolled ? c!.percent : 0} enrolled={enrolled}
      lastLesson={enrolled ? c!.flat.find((l) => l.id === c!.enrollment?.last_lesson_id)?.title : undefined}
      continueHref={!enrolled ? `/courses/${c!.course.slug}${Number(c!.course.price) === 0 && c!.flat[0] ? `/${c!.flat[0].id}` : ""}`
        : c!.percent === 100 ? `/courses/${c!.course.slug}/complete` : `/courses/${c!.course.slug}/${c!.nextLesson?.id}`} />
  );

  return (
    <>
      <PageHeader eyebrow="Learn" title="Courses" subtitle="Your courses, free tutorials and more to explore." />
      <div className="space-y-4">
        {loaded.length === 0 && <EmptyState icon={BookOpen} title="Your learning journey starts here." body="Courses will appear here soon." />}
        {mine.length > 0 && <h2 className="text-lg font-semibold">My Courses</h2>}
        {mine.map((c) => card(c, true))}
        {free.length > 0 && (
          <div className="pt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Gift className="size-5 text-ok" /> Free Tutorials</h2>
            <p className="text-sm text-mute">No payment needed — start learning right away.</p>
          </div>
        )}
        {free.map((c) => card(c, false))}
        {paid.length > 0 && <h2 className="pt-6 text-lg font-semibold">{mine.length || free.length ? "Explore" : "Courses"}</h2>}
        {paid.map((c) => card(c, false))}
      </div>
    </>
  );
}
