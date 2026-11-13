"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, MoreHorizontal, Pin, Share2, Star, Trash2, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { deletePost } from "@/lib/actions/bottle";
import type { FeedPost } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { VerticalVideo } from "./VerticalVideo";
import { CommentSection } from "./CommentSection";

export function BottlePost({ post, userId, isAdmin, canInteract, onDeleted }: {
  post: FeedPost; userId: string; isAdmin: boolean; canInteract: boolean; onDeleted?: (id: string) => void;
}) {
  const supabase = createClient();
  const toast = useToast();
  const router = useRouter();
  const [liked, setLiked] = useState(!!post.liked);
  const [likes, setLikes] = useState(post.like_count);
  const [comments, setComments] = useState(post.comment_count);
  const [openComments, setOpenComments] = useState(false);
  const [menu, setMenu] = useState(false);
  const [pop, setPop] = useState(0);
  const mine = post.user_id === userId;

  async function like() {
    if (!canInteract) return toast("Enroll in the masterclass to like posts.", "info");
    const next = !liked;
    setLiked(next); setLikes((n) => n + (next ? 1 : -1)); if (next) setPop((p) => p + 1);
    const { error } = next
      ? await supabase.from("likes").insert({ post_id: post.id, user_id: userId })
      : await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", userId);
    if (error && error.code !== "23505") { setLiked(!next); setLikes((n) => n + (next ? -1 : 1)); toast("Something went wrong. Please try again.", "error"); }
  }
  async function share() {
    const url = `${location.origin}/bottle/${post.id}`;
    if (navigator.share) { try { await navigator.share({ title: "ROCHELLE OS · Bottle", text: post.caption, url }); } catch {} }
    else { await navigator.clipboard.writeText(url); toast("Link copied."); }
  }
  async function remove() {
    if (!confirm("Delete this post?")) return;
    const r = await deletePost(post.id);
    if (!r.ok) return toast(r.error, "error");
    toast("Post deleted."); onDeleted?.(post.id); router.refresh();
  }


  return (
    <article className="relative flex h-full w-full items-center justify-center gap-4 md:py-3">
      <div className="relative h-full w-full md:aspect-[9/16] md:w-auto md:max-w-full md:overflow-hidden md:rounded-3xl md:border md:border-line">
        <VerticalVideo src={post.video_url} poster={post.poster_url} className="size-full" />
        {/* Overlay: author + caption */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 pb-5 pr-20 pt-24 md:pr-4">
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
            {post.pinned && <span className="chip border-gold/30 bg-black/40 text-gold"><Pin className="size-3" /> Pinned</span>}
            {post.featured && <span className="chip border-gold/30 bg-black/40 text-gold"><Star className="size-3 fill-current" /> Featured</span>}
            {post.challenge && <Link href={`/challenges/${post.challenge.id}`} className="chip border-accent/40 bg-accent/20 text-white"><Trophy className="size-3" /> {post.challenge.title}</Link>}
          </div>
          <Link href={`/u/${post.user_id}`} className="pointer-events-auto mt-2 flex w-fit items-center gap-2.5">
            <Avatar name={post.author?.full_name ?? "?"} src={post.author?.avatar_url} size={36} />
            <span><span className="block text-sm font-semibold">{post.author?.full_name}</span><span className="block text-[11px] text-white/60">{timeAgo(post.created_at)}</span></span>
          </Link>
          {post.caption && <p className="pointer-events-auto mt-2.5 line-clamp-3 text-sm leading-snug">{post.caption}</p>}
          {!!post.tags.length && <p className="pointer-events-auto mt-1.5 flex flex-wrap gap-x-2 text-[13px] font-semibold text-white/85">{post.tags.map((t) => <Link key={t} href={`/bottle?tag=${encodeURIComponent(t)}`}>#{t}</Link>)}</p>}
        </div>
        {/* Mobile action rail */}
        <div className="absolute bottom-24 right-3 flex flex-col gap-4 md:hidden">
          <Action onClick={like} active={liked} label={likes} icon={<Heart key={pop} className={cn("size-6", liked && "animate-pop fill-accent text-accent")} />} />
          <Action onClick={() => setOpenComments(true)} label={comments} icon={<MessageCircle className="size-6" />} />
          <Action onClick={share} label="Share" icon={<Share2 className="size-5" />} />
          {(mine || isAdmin) && <Action onClick={() => setMenu(true)} label="" icon={<MoreHorizontal className="size-5" />} />}
        </div>
      </div>
      {/* Desktop action rail */}
      <div className="hidden flex-col gap-5 self-end pb-8 md:flex">
        <Action onClick={like} active={liked} label={likes} icon={<Heart key={pop} className={cn("size-6", liked && "animate-pop fill-accent text-accent")} />} />
        <Action onClick={() => setOpenComments(true)} label={comments} icon={<MessageCircle className="size-6" />} />
        <Action onClick={share} label="Share" icon={<Share2 className="size-5" />} />
        {(mine || isAdmin) && <Action onClick={() => setMenu(true)} label="" icon={<MoreHorizontal className="size-5" />} />}
      </div>

      <Modal open={openComments} onClose={() => setOpenComments(false)} title={`Comments · ${comments}`}>
        <CommentSection postId={post.id} userId={userId} isAdmin={isAdmin} canComment={canInteract} onCountChange={(d) => setComments((c) => c + d)} />
      </Modal>
      <Modal open={menu} onClose={() => setMenu(false)} title="Post options">
        <button onClick={() => { setMenu(false); remove(); }} className="btn-danger w-full"><Trash2 className="size-4" /> Delete post</button>
      </Modal>
    </article>
  );
}

function Action({ onClick, icon, label, active }: { onClick: () => void; icon: React.ReactNode; label: React.ReactNode; active?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-1 text-xs font-semibold drop-shadow transition active:scale-90", active && "text-accent")}>
      <span className="grid size-12 place-items-center rounded-full bg-black/35 backdrop-blur-md md:bg-white/[0.06]">{icon}</span>{label}
    </button>
  );
}
