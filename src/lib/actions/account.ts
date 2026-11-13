"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { fail } from "./_run";

export async function updateProfile(input: { full_name: string; bio: string; avatar_url?: string | null }): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  if (input.full_name.trim().length < 2) return { ok: false, error: "Name is too short." };
  const patch: Record<string, unknown> = { full_name: input.full_name.trim(), bio: input.bio.trim().slice(0, 280) };
  if (input.avatar_url !== undefined) patch.avatar_url = input.avatar_url;
  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateSettings(input: { notify_email: boolean; notify_push: boolean; is_private: boolean }): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { error } = await supabase.from("profiles").update(input).eq("id", user.id);
  return error ? fail(error) : { ok: true };
}

export async function changePassword(password: string): Promise<ActionResult> {
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  return error ? fail(error) : { ok: true };
}

export async function markMessagesRead(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("messages").update({ read: true }).eq("recipient_id", user.id).eq("read", false);
}

export async function sendMessageToAdmin(content: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { data: admin } = await supabase.from("profiles").select("id").eq("role", "admin").order("created_at").limit(1).single();
  if (!admin) return { ok: false, error: "No instructor available." };
  const { error } = await supabase.from("messages").insert({ sender_id: user.id, recipient_id: admin.id, content: content.trim() });
  if (error) return fail(error);
  revalidatePath("/messages");
  return { ok: true };
}
