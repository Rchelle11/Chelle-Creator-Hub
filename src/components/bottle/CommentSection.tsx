"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CornerDownRight, Loader2, Send, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import type { Comment } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

type Table = "comments" | "community_comments";

export function CommentSection({ postId, userId, isAdmin, canComment, table = "comments", onCountChange }: {
  postId: string; userId: string; isAdmin: boolean; canComment: boolean; table?: Table; onCountChange?: (delta: number) => void;
}) {
  const supabase = createClient();
  const toast = useToast();
  const [items, setItems] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from(table).select("*, author:profiles(id, full_name, avatar_url)")
      .eq("post_id", postId).order("created_at");
    setItems((data ?? []) as Comment[]);
  }, [supabase, postId, table]);
  useEffect(() => { load(); }, [load]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const { data, error } = await supabase.from(table)
      .insert({ post_id: postId, user_id: userId, content: text.trim(), parent_id: replyTo?.parent_id ?? replyTo?.id ?? null })
      .select("*, author:profiles(id, full_name, avatar_url)").single();
    setSending(false);
    if (error) return toast(/row-level/.test(error.message) ? "Enroll in the masterclass to comment." : "Something went wrong. Please try again.", "error");
    setItems((x) => [...(x ?? []), data as Comment]);
    setText(""); setReplyTo(null); onCountChange?.(1);
  }

  async function remove(c: Comment) {
    const { error } = await supabase.from(table).delete().eq("id", c.id);
    if (error) return toast("Couldn't delete comment.", "error");
    setItems((x) => (x ?? []).filter((y) => y.id !== c.id && y.parent_id !== c.id));
    onCountChange?.(-1);
    toast("Comment deleted.");
  }

  const roots = (items ?? []).filter((c) => !c.parent_id);
  const replies = (id: string) => (items ?? []).filter((c) => c.parent_id === id);

  const Row = ({ c, child }: { c: Comment; child?: boolean }) => (
    <div className={child ? "ml-11 mt-3" : ""}>
      <div className="flex gap-3">
        <Link href={`/u/${c.user_id}`}><Avatar name={c.author?.full_name ?? "?"} src={c.author?.avatar_url} size={child ? 28 : 34} /></Link>
        <div className="min-w-0 flex-1">
          <p className="text-[13px]"><Link href={`/u/${c.user_id}`} className="font-semibold hover:underline">{c.author?.full_name}</Link> <span className="text-xs text-mute">· {timeAgo(c.created_at)}</span></p>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-soft">{c.content}</p>
          <div className="mt-1 flex gap-4 text-xs text-mute">
            {canComment && <button onClick={() => setReplyTo(c)} className="hover:text-white">Reply</button>}
            {(c.user_id === userId || isAdmin) && <button onClick={() => remove(c)} className="flex items-center gap-1 hover:text-bad"><Trash2 className="size-3" /> Delete</button>}
          </div>
        </div>
      </div>
      {!child && replies(c.id).map((r) => <Row key={r.id} c={r} child />)}
    </div>
  );

  return (
    <div className="flex flex-col">
      <div className="min-h-32 space-y-5">
        {items === null && <div className="grid place-items-center py-10"><Loader2 className="size-5 animate-spin text-mute" /></div>}
        {items?.length === 0 && <p className="py-8 text-center text-sm text-mute">No comments yet. Leave the first feedback.</p>}
        {roots.map((c) => <Row key={c.id} c={c} />)}
      </div>
      {canComment ? (
        <form onSubmit={send} className="sticky bottom-0 -mx-5 mt-5 border-t border-line bg-ink-2 px-5 pt-3">
          {replyTo && (
            <p className="mb-2 flex items-center gap-1.5 text-xs text-mute"><CornerDownRight className="size-3.5" /> Replying to {replyTo.author?.full_name}
              <button type="button" onClick={() => setReplyTo(null)} className="ml-auto hover:text-white">Cancel</button></p>
          )}
          <div className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Add helpful feedback…" className="input h-11" />
            <button disabled={sending || !text.trim()} className="btn-primary h-11 px-4" aria-label="Send">{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</button>
          </div>
        </form>
      ) : <p className="mt-5 text-center text-xs text-mute">Enroll in the masterclass to join the conversation.</p>}
    </div>
  );
}
