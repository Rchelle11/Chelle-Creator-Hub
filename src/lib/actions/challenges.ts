"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { fail } from "./_run";

export async function joinChallenge(challengeId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { error } = await supabase.from("challenge_participants").insert({ challenge_id: challengeId, user_id: user.id });
  if (error && error.code !== "23505") {
    if (/row-level security/i.test(error.message)) return { ok: false, error: "Enroll in the masterclass to join challenges." };
    return fail(error);
  }
  revalidatePath(`/challenges/${challengeId}`);
  revalidatePath("/challenges");
  return { ok: true };
}
