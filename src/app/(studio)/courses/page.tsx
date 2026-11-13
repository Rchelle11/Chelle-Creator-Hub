import { BookOpen } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { loadCourse } from "@/lib/course";
import { PageHeader } from "@/components/ui/PageHeader";
import { CourseCard } from "@/components/course/CourseCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "My Courses" };

export default async function CoursesPage() {
  const { supabase, user } = await requireUser();
  const { data: courses } = await supabase.from("courses").select("slug").eq("published", true).order("created_at");
  const loaded = (await Promise.all((courses ?? []).map((c) => loadCourse(supabase, c.slug, user.id)))).filter(Boolean);
  const mine = loaded.filter((c) => c!.enrolled);
  const others = loaded.filter((c) => !c!.enrolled);

  return (
    <>
      <PageHeader eyebrow="Learn" title="My Courses" subtitle="Everything you're learning, in one place." />
      <div className="space-y-4">
        {mine.length === 0 && others.length === 0 && (
          <EmptyState icon={BookOpen} title="Your learning journey starts here." cta="Explore Courses" href="/" />
        )}
        {mine.map((c) => (
          <CourseCard key={c!.course.id} slug={c!.course.slug} title={c!.course.title} description={c!.course.description}
            thumbnail={c!.course.thumbnail_url} modules={c!.outline.length} lessons={c!.total} percent={c!.percent}
            lastLesson={c!.flat.find((l) => l.id === c!.enrollment?.last_lesson_id)?.title} enrolled
            continueHref={c!.percent === 100 ? `/courses/${c!.course.slug}/complete` : `/courses/${c!.course.slug}/${c!.nextLesson?.id}`} />
        ))}
        {others.length > 0 && mine.length > 0 && <h2 className="pt-6 text-lg font-semibold">Explore</h2>}
        {others.map((c) => (
          <CourseCard key={c!.course.id} slug={c!.course.slug} title={c!.course.title} description={c!.course.description}
            thumbnail={c!.course.thumbnail_url} modules={c!.outline.length} lessons={c!.total} percent={0} enrolled={false}
            continueHref={`/courses/${c!.course.slug}`} />
        ))}
      </div>
    </>
  );
}
