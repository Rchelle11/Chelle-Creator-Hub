"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { fail } from "./_run";

export type CompleteResult = { percent: number; completed: number; total: number; next_lesson_id: string | null; course_completed: boolean };

export async function completeLesson(lessonId: string): Promise<ActionResult<CompleteResult>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_lesson", { p_lesson_id: lessonId });
  if (error) return fail(error);
  revalidatePath("/courses", "layout");
  revalidatePath("/dashboard");
  return { ok: true, data: data as CompleteResult };
}

export async function saveNotes(lessonId: string, content: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { error } = await supabase.from("lesson_notes")
    .upsert({ user_id: user.id, lesson_id: lessonId, content: content.slice(0, 20000), updated_at: new Date().toISOString() });
  return error ? fail(error) : { ok: true };
}

export async function enrollFree(courseId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("enroll_free", { p_course_id: courseId });
  if (error) return fail(error);
  revalidatePath("/courses", "layout");
  revalidatePath("/dashboard");
  return { ok: true };
}
