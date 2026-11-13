"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { saveCourse } from "@/lib/actions/admin";

export function NewCourseButton() {
  const [pending, start] = useTransition(); const router = useRouter(); const toast = useToast();
  return (
    <button disabled={pending} className="btn-primary" onClick={() => {
      const title = prompt("Course title"); if (!title) return;
      start(async () => {
        const r = await saveCourse({ title, slug: title, subtitle: "", description: "", thumbnail_url: null, instructor_name: "Rochelle", instructor_bio: "", price: 0, published: false });
        if (r.ok) router.push(`/admin/courses/${r.data}`); else toast(r.error, "error");
      });
    }}><Plus className="size-4" /> New course</button>
  );
}
