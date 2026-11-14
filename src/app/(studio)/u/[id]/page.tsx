import Link from "next/link";
import { notFound } from "next/navigation";
import { Clapperboard, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { StatCard, Badge } from "@/components/ui/PageHeader";
import { PostGrid } from "@/components/bottle/PostGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Profile } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: p } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle<Profile>();
  if (!p) notFound();
  const own = p.id === user.id;
  const [{ data: stats }, { data: posts }] = await Promise.all([
    supabase.rpc("creator_stats", { p_user: id }),
    supabase.from("posts").select("id, video_url, poster_url, like_count, featured").eq("user_id", id).eq("status", "published").order("created_at", { ascending: false }),
  ]);
  const s = (stats ?? {}) as { videos: number; likes: number; challenges: number; lessons: number };
  const hidden = p.is_private && !own;

  return (
    <div className="space-y-8">
      <header className="flex flex-col items-center text-center md:flex-row md:items-end md:gap-6 md:text-left">
        <Avatar name={p.full_name} src={p.avatar_url} size={104} className="ring-4 ring-accent/30" />
        <div className="mt-4 md:mt-0">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <h1 className="h-display text-4xl md:text-5xl">{p.full_name}</h1>
            {p.role === "admin" && <Badge tone="accent">Instructor</Badge>}
          </div>
          {p.bio && <p className="mt-2 max-w-lg text-soft">{p.bio}</p>}
          <p className="mt-1 text-xs text-mute">Creator since {fmtDate(p.created_at)}</p>
        </div>
        {own && <Link href="/account" className="btn-ghost btn-sm mt-4 md:ml-auto md:mt-0">Edit profile</Link>}
      </header>

      {hidden ? (
        <div className="glass flex items-center justify-center gap-2 p-10 text-mute"><Lock className="size-4" /> This creator keeps their profile private.</div>
      ) : (
        <>
          <section>
            <h2 className="label mb-3">Creator stats</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Videos posted" value={s.videos ?? 0} />
              <StatCard label="Challenges completed" value={s.challenges ?? 0} />
              <StatCard label="Likes received" value={s.likes ?? 0} />
              <StatCard label="Lessons completed" value={s.lessons ?? 0} />
            </div>
          </section>
          <section>
            <h2 className="label mb-3">Their work</h2>
            {posts?.length ? <PostGrid posts={posts} /> : (
              <EmptyState icon={Clapperboard} title="Nothing here yet." body={own ? "Be the first creator to share your work." : "No videos posted yet."}
                cta={own ? "Post Your First Video" : undefined} href="/battles/new" />
            )}
          </section>
        </>
      )}
    </div>
  );
}
