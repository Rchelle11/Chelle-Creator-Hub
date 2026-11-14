"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { fail } from "./_run";

export async function createPost(input: {
  videoUrl: string; videoPath: string; posterUrl: string | null; caption: string; tags: string[]; challengeId: string | null; day?: number; explanation?: string;
}): Promise<ActionResult<string>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  if (!input.videoPath.startsWith(user.id + "/")) return { ok: false, error: "Invalid upload." };

  let postId: string;
  if (input.challengeId) {
    const { data, error } = await supabase.rpc("submit_challenge", {
      p_challenge_id: input.challengeId, p_day: input.day ?? 1, p_video_url: input.videoUrl, p_video_path: input.videoPath,
      p_caption: input.caption, p_explanation: input.explanation ?? "", p_tags: input.tags,
    });
    if (error) return error.code === "23505" ? { ok: false, error: `You already submitted Day ${input.day ?? 1}.` } : fail(error);
    postId = data as string;
    if (input.posterUrl) await supabase.from("posts").update({ poster_url: input.posterUrl }).eq("id", postId);
    revalidatePath(`/challenges/${input.challengeId}`);
  } else {
    const { data, error } = await supabase.from("posts").insert({
      user_id: user.id, video_url: input.videoUrl, video_path: input.videoPath, poster_url: input.posterUrl,
      caption: input.caption.slice(0, 2200), tags: input.tags,
    }).select("id").single();
    if (error) return fail(error);
    postId = data.id;
  }
  revalidatePath("/battles");
  revalidatePath("/dashboard");
  return { ok: true, data: postId };
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select("video_path, poster_url").eq("id", postId).single();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return fail(error);
  if (post?.video_path) await supabase.storage.from("bottle").remove([post.video_path, post.video_path.replace(/\.[^.]+$/, ".jpg")]);
  revalidatePath("/battles");
  return { ok: true };
}
