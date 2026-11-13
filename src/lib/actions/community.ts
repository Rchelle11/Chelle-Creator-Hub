"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { fail } from "./_run";

export async function createDiscussion(input: { category: string; title: string; body: string }): Promise<ActionResult<string>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  if (!input.title.trim()) return { ok: false, error: "Add a title." };
  const { data, error } = await supabase.from("community_posts")
    .insert({ user_id: user.id, category: input.category, title: input.title.trim(), body: input.body.trim() })
    .select("id").single();
  if (error) return /row-level/.test(error.message) ? { ok: false, error: "Enroll in the masterclass to post in the community." } : fail(error);
  revalidatePath("/community");
  return { ok: true, data: data.id };
}

export async function deleteDiscussion(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("community_posts").delete().eq("id", id);
  if (error) return fail(error);
  revalidatePath("/community");
  return { ok: true };
}
