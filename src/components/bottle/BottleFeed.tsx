"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { FeedPost } from "@/lib/types";
import { BottlePost } from "./BottlePost";
import { FEED_SELECT, PAGE } from "@/lib/feed";


export function BottleFeed({ initial, userId, isAdmin, canInteract, tag, featured }: {
  initial: FeedPost[]; userId: string; isAdmin: boolean; canInteract: boolean; tag?: string; featured?: boolean;
}) {
  const supabase = createClient();
  const [posts, setPosts] = useState(initial);
  const [done, setDone] = useState(initial.length < PAGE);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current; if (!el || done) return;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || loading) return;
      setLoading(true);
      let q = supabase.from("posts").select(FEED_SELECT).eq("status", "published")
        .order("pinned", { ascending: false }).order("created_at", { ascending: false })
        .range(posts.length, posts.length + PAGE - 1);
      if (tag) q = q.contains("tags", [tag]);
      if (featured) q = q.eq("featured", true);
      const { data } = await q;
      const ids = (data ?? []).map((p) => p.id);
      const { data: mine } = ids.length ? await supabase.from("likes").select("post_id").eq("user_id", userId).in("post_id", ids) : { data: [] };
      const liked = new Set((mine ?? []).map((l) => l.post_id));
      const more = ((data ?? []) as FeedPost[]).map((p) => ({ ...p, liked: liked.has(p.id) }));
      setPosts((x) => [...x, ...more.filter((m) => !x.some((y) => y.id === m.id))]);
      if (more.length < PAGE) setDone(true);
      setLoading(false);
    }, { rootMargin: "200% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [done, loading, posts.length, supabase, tag, featured, userId]);

  return (
    <div className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto overscroll-contain">
      {posts.map((p) => (
        <div key={p.id} className="h-full snap-start snap-always">
          <BottlePost post={p} userId={userId} isAdmin={isAdmin} canInteract={canInteract}
            onDeleted={(id) => setPosts((x) => x.filter((y) => y.id !== id))} />
        </div>
      ))}
      <div ref={sentinel} className="grid h-24 place-items-center">
        {loading && <Loader2 className="size-5 animate-spin text-mute" />}
        {done && posts.length > 0 && <p className="text-xs text-mute">You&apos;re all caught up ✨</p>}
      </div>
    </div>
  );
}
