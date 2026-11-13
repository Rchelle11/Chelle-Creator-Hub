import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Badge } from "@/components/ui/PageHeader";
import { NewCourseButton } from "./NewCourseButton";
import { peso } from "@/lib/utils";

export const metadata = { title: "Courses" };

export default async function AdminCourses() {
  const { supabase } = await requireAdmin();
  const { data: courses } = await supabase.from("courses").select("*, modules(count), lessons(count), enrollments(count)").order("created_at");
  return (
    <>
      <PageHeader eyebrow="Admin" title="Courses" action={<NewCourseButton />} />
      <div className="grid gap-4 md:grid-cols-2">
        {(courses ?? []).map((c) => (
          <Link key={c.id} href={`/admin/courses/${c.id}`} className="glass glass-hover overflow-hidden">
            {c.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.thumbnail_url} alt="" className="aspect-[3/1] w-full object-cover" />
            )}
            <div className="p-5">
              <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{c.title}</h2><Badge tone={c.published ? "ok" : "neutral"}>{c.published ? "Published" : "Draft"}</Badge></div>
              <p className="mt-2 text-sm text-mute">{c.modules[0]?.count ?? 0} modules · {c.lessons[0]?.count ?? 0} lessons · {c.enrollments[0]?.count ?? 0} students · {peso(c.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
