"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { deleteDiscussion } from "@/lib/actions/community";
import { cn } from "@/lib/utils";

export function DiscussionActions({ id, userId, liked: l0, likes: n0, canDelete }: { id: string; userId: string; liked: boolean; likes: number; canDelete: boolean }) {
  const supabase = createClient();
  const toast = useToast();
  const router = useRouter();
  const [liked, setLiked] = useState(l0);
  const [likes, setLikes] = useState(n0);
  async function like() {
    const next = !liked; setLiked(next); setLikes((n) => n + (next ? 1 : -1));
    const { error } = next ? await supabase.from("community_likes").insert({ post_id: id, user_id: userId })
      : await supabase.from("community_likes").delete().eq("post_id", id).eq("user_id", userId);
    if (error) { setLiked(!next); setLikes((n) => n + (next ? -1 : 1)); toast(/row-level/.test(error.message) ? "Enroll to like posts." : "Something went wrong. Please try again.", "error"); }
  }
  return (
    <div className="flex items-center gap-2">
      <button onClick={like} className={cn("btn-ghost btn-sm", liked && "border-accent/40 text-accent")}><Heart className={cn("size-4", liked && "animate-pop fill-current")} /> {likes}</button>
      {canDelete && <button onClick={async () => { if (!confirm("Delete this discussion?")) return; const r = await deleteDiscussion(id); if (r.ok) { toast("Deleted."); router.push("/community"); } else toast(r.error, "error"); }} className="btn-quiet btn-sm text-bad"><Trash2 className="size-4" /></button>}
    </div>
  );
}
