import Link from "next/link";
import { Clapperboard, Plus, Star } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { BottleFeed } from "@/components/bottle/BottleFeed";
import { FEED_SELECT, PAGE } from "@/lib/feed";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import type { FeedPost } from "@/lib/types";
import { SUGGESTED_TAGS } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Bottle" };

export default async function BottlePage({ searchParams }: { searchParams: Promise<{ tag?: string; view?: string }> }) {
  const { tag, view } = await searchParams;
  const featured = view === "featured";
  const { supabase, user, profile } = await requireUser();

  let q = supabase.from("posts").select(FEED_SELECT).eq("status", "published")
    .order("pinned", { ascending: false }).order("created_at", { ascending: false }).range(0, PAGE - 1);
  if (tag) q = q.contains("tags", [tag]);
  if (featured) q = q.eq("featured", true);
  const [{ data }, { data: canPost }, { data: creators }] = await Promise.all([
    q, supabase.rpc("has_access"),
    supabase.from("posts").select("author:profiles!posts_user_id_fkey(id, full_name, avatar_url)").eq("featured", true).eq("status", "published").order("created_at", { ascending: false }).limit(8),
  ]);
  const ids = (data ?? []).map((p) => p.id);
  const { data: mine } = ids.length ? await supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", ids) : { data: [] };
  const liked = new Set((mine ?? []).map((l) => l.post_id));
  const posts = ((data ?? []) as FeedPost[]).map((p) => ({ ...p, liked: liked.has(p.id) }));
  const uniqueCreators = Array.from(new Map((creators ?? []).map((c) => {
    const a = c.author as unknown as { id: string; full_name: string; avatar_url: string | null };
    return [a.id, a];
  })).values());

  const filters = [{ label: "For You", href: "/bottle", active: !tag && !featured }, { label: "Featured", href: "/bottle?view=featured", active: featured },
    ...SUGGESTED_TAGS.map((t) => ({ label: `#${t}`, href: `/bottle?tag=${t}`, active: tag === t }))];

  return (
    <div className="-mx-4 -mb-28 -mt-5 md:m-0 md:grid md:grid-cols-[minmax(0,1fr)_300px] md:gap-8">
      <div className="relative h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom)-env(safe-area-inset-top))] md:h-[calc(100dvh-8rem)]">
        {/* Mobile overlay header */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-4 pb-8 pt-3 md:hidden">
          <div className="pointer-events-auto flex items-center justify-between">
            <span className="text-sm font-extrabold tracking-[0.22em]">BOTTLE</span>
            {canPost && <Link href="/bottle/new" className="btn-primary btn-sm"><Plus className="size-4" /> POST</Link>}
          </div>
          <div className="no-scrollbar pointer-events-auto -mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4">
            {filters.map((f) => <Link key={f.href} href={f.href} className={cn("chip shrink-0 bg-black/30 backdrop-blur", f.active && "border-white/40 text-white")}>{f.label}</Link>)}
          </div>
        </div>
        {posts.length ? (
          <BottleFeed key={`${tag}-${featured}`} initial={posts} userId={user.id} isAdmin={profile.role === "admin"} canInteract={!!canPost} tag={tag} featured={featured} />
        ) : (
          <div className="grid h-full place-items-center px-4 pt-24 md:pt-0">
            <EmptyState icon={Clapperboard} title="Nothing here yet." body="Be the first creator to share your work." cta={canPost ? "Post Your First Video" : undefined} href="/bottle/new" />
          </div>
        )}
      </div>

      <aside className="hidden space-y-5 md:block">
        <div>
          <h1 className="h-display text-5xl">BOTTLE</h1>
          <p className="mt-2 text-sm text-mute">Post your work. Get feedback. Get inspired.</p>
          {canPost
            ? <Link href="/bottle/new" className="btn-primary mt-5 w-full"><Plus className="size-4" /> POST YOUR VIDEO</Link>
            : <Link href="/courses" className="btn-ghost mt-5 w-full">Enroll to start posting</Link>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => <Link key={f.href} href={f.href} className={cn("chip transition hover:text-white", f.active && "border-accent/50 bg-accent/10 text-white")}>{f.label}</Link>)}
        </div>
        {uniqueCreators.length > 0 && (
          <div className="glass p-4">
            <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold"><Star className="size-3.5 fill-current" /> Featured Creators</p>
            <div className="space-y-2.5">
              {uniqueCreators.map((c) => (
                <Link key={c.id} href={`/u/${c.id}`} className="flex items-center gap-3 rounded-lg text-sm hover:text-accent">
                  <Avatar name={c.full_name} src={c.avatar_url} size={32} /> {c.full_name}
                </Link>
              ))}
            </div>
          </div>
        )}
        <Link href="/challenges#leaderboard" className="glass glass-hover block p-4 text-sm">🏆 <b>Creator of the Week</b><span className="mt-1 block text-xs text-mute">See this week&apos;s leaderboard →</span></Link>
      </aside>
    </div>
  );
}
