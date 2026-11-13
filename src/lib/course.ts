import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course, Enrollment, Lesson, Module } from "./types";

export type LessonState = "completed" | "available" | "locked";
export interface OutlineLesson extends Lesson { state: LessonState; index: number; moduleIndex: number; lessonIndex: number }
export interface OutlineModule extends Module { lessons: OutlineLesson[] }

/** Loads a course with its ordered outline and the viewer's progress/lock state. */
export async function loadCourse(supabase: SupabaseClient, slug: string, userId: string | null) {
  const { data: course } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle<Course>();
  if (!course) return null;

  const [{ data: modules }, { data: lessons }, enrollmentRes, progressRes] = await Promise.all([
    supabase.from("modules").select("*").eq("course_id", course.id).order("position"),
    supabase.from("lessons").select("*").eq("course_id", course.id).eq("published", true).order("position"),
    userId
      ? supabase.from("enrollments").select("*").eq("course_id", course.id).eq("user_id", userId).maybeSingle<Enrollment>()
      : Promise.resolve({ data: null }),
    userId
      ? supabase.from("lesson_progress").select("lesson_id, completed").eq("course_id", course.id).eq("user_id", userId)
      : Promise.resolve({ data: [] as { lesson_id: string; completed: boolean }[] }),
  ]);

  const enrollment = (enrollmentRes.data ?? null) as Enrollment | null;
  const enrolled = !!enrollment && enrollment.status !== "suspended";
  const done = new Set((progressRes.data ?? []).filter((p) => p.completed).map((p) => p.lesson_id));

  let index = 0;
  let previousDone = true;
  const outline: OutlineModule[] = ((modules ?? []) as Module[]).map((m, mi) => {
    const ls = ((lessons ?? []) as Lesson[]).filter((l) => l.module_id === m.id);
    return {
      ...m,
      lessons: ls.map((l, li) => {
        index += 1;
        const completed = done.has(l.id);
        const state: LessonState = !enrolled
          ? l.is_preview ? "available" : "locked"
          : completed ? "completed" : previousDone ? "available" : "locked";
        previousDone = previousDone && completed;
        return { ...l, state, index, moduleIndex: mi + 1, lessonIndex: li + 1 };
      }),
    };
  });

  const flat = outline.flatMap((m) => m.lessons);
  const completedCount = flat.filter((l) => l.state === "completed").length;
  const nextLesson =
    (enrollment?.last_lesson_id && flat.find((l) => l.id === enrollment.last_lesson_id && l.state !== "completed")) ||
    flat.find((l) => l.state === "available") ||
    flat[0] ||
    null;

  return {
    course, outline, flat, enrollment, enrolled,
    completedCount, total: flat.length,
    percent: flat.length ? Math.floor((completedCount * 100) / flat.length) : 0,
    nextLesson,
  };
}
