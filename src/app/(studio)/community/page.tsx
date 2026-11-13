import Link from "next/link";
import { Heart, MessageCircle, MessagesSquare, Pin } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader, Badge } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewDiscussion } from "@/components/community/NewDiscussion";
import { COMMUNITY_CATEGORIES } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export const metadata = { title: "Community" };

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const { supabase } = await requireUser();
  let q = supabase.from("community_posts").select("*, author:profiles!community_posts_user_id_fkey(id, full_name, avatar_url)")
    .order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(50);
  if (c) q = q.eq("category", c);
  const { data: posts } = await q;
  const label = (id: string) => COMMUNITY_CATEGORIES.find((x) => x.id === id)?.label ?? id;

  return (
    <>
      <PageHeader eyebrow="Connect" title="Community" subtitle="Ask questions, share ideas, celebrate wins." action={<NewDiscussion defaultCategory={c} />} />
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <Link href="/community" className={cn("chip shrink-0", !c && "border-accent/50 bg-accent/10 text-white")}>All</Link>
        {COMMUNITY_CATEGORIES.map((x) => <Link key={x.id} href={`/community?c=${x.id}`} className={cn("chip shrink-0", c === x.id && "border-accent/50 bg-accent/10 text-white")}>{x.label}</Link>)}
      </div>
      {!posts?.length ? <EmptyState icon={MessagesSquare} title="No discussions yet." body="Start the first conversation." /> : (
        <div className="space-y-2.5">
          {posts.map((p) => (
            <Link key={p.id} href={`/community/${p.id}`} className="glass glass-hover flex gap-3 p-4">
              <Avatar name={p.author?.full_name ?? "?"} src={p.author?.avatar_url} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-mute">
                  <span className="font-semibold text-soft">{p.author?.full_name}</span> · {timeAgo(p.created_at)}
                  <Badge>{label(p.category)}</Badge>{p.pinned && <Pin className="size-3.5 text-gold" />}
                </div>
                <h3 className="mt-1 font-semibold">{p.title}</h3>
                {p.body && <p className="mt-0.5 line-clamp-2 text-sm text-mute">{p.body}</p>}
                <div className="mt-2 flex gap-4 text-xs text-mute">
                  <span className="flex items-center gap-1"><Heart className="size-3.5" />{p.like_count}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="size-3.5" />{p.comment_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
