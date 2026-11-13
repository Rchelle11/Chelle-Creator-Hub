import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { CourseEditor } from "@/components/admin/CourseEditor";

export default async function EditCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: course } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
  if (!course) notFound();
  const [{ data: modules }, { data: lessons }] = await Promise.all([
    supabase.from("modules").select("*").eq("course_id", id).order("position"),
    supabase.from("lessons").select("*, content:lesson_content(video_path, video_url, body), resources:lesson_resources(*)").eq("course_id", id).order("position"),
  ]);
  return (
    <>
      <Link href="/admin/courses" className="mb-4 inline-flex items-center gap-1 text-sm text-mute hover:text-white"><ChevronLeft className="size-4" /> Courses</Link>
      <PageHeader eyebrow="Course management" title={course.title} action={<Link href={`/courses/${course.slug}`} className="btn-ghost btn-sm">Preview as student</Link>} />
      <CourseEditor course={{ ...course, price: Number(course.price) }} modules={modules ?? []} lessons={(lessons ?? []) as never} />
    </>
  );
}
