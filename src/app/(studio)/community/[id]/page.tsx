import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/PageHeader";
import { CommentSection } from "@/components/bottle/CommentSection";
import { DiscussionActions } from "@/components/community/DiscussionActions";
import { COMMUNITY_CATEGORIES } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export default async function DiscussionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await requireUser();
  const [{ data: p }, { data: like }, { data: canPost }] = await Promise.all([
    supabase.from("community_posts").select("*, author:profiles!community_posts_user_id_fkey(id, full_name, avatar_url)").eq("id", id).maybeSingle(),
    supabase.from("community_likes").select("post_id").eq("post_id", id).eq("user_id", user.id).maybeSingle(),
    supabase.rpc("has_access"),
  ]);
  if (!p) notFound();
  const isAdmin = profile.role === "admin";
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/community" className="mb-4 inline-flex items-center gap-1 text-sm text-mute hover:text-white"><ChevronLeft className="size-4" /> Community</Link>
      <article className="glass p-5 md:p-7">
        <div className="flex items-center gap-3">
          <Link href={`/u/${p.user_id}`}><Avatar name={p.author?.full_name ?? "?"} src={p.author?.avatar_url} size={44} /></Link>
          <div><Link href={`/u/${p.user_id}`} className="font-semibold hover:underline">{p.author?.full_name}</Link><p className="text-xs text-mute">{timeAgo(p.created_at)}</p></div>
          <span className="ml-auto"><Badge>{COMMUNITY_CATEGORIES.find((c) => c.id === p.category)?.label}</Badge></span>
        </div>
        <h1 className="mt-5 text-2xl font-semibold leading-snug">{p.title}</h1>
        {p.body && <p className="mt-3 whitespace-pre-wrap leading-relaxed text-soft">{p.body}</p>}
        <div className="mt-6 border-t border-line pt-4">
          <DiscussionActions id={p.id} userId={user.id} liked={!!like} likes={p.like_count} canDelete={p.user_id === user.id || isAdmin} />
        </div>
      </article>
      <section className="glass mt-4 p-5 md:p-7">
        <h2 className="label mb-4">Replies · {p.comment_count}</h2>
        <CommentSection table="community_comments" postId={p.id} userId={user.id} isAdmin={isAdmin} canComment={!!canPost} />
      </section>
    </div>
  );
}
