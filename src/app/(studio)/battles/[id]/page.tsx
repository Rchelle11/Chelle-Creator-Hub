import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { BottlePost } from "@/components/bottle/BottlePost";
import { FEED_SELECT } from "@/lib/feed";
import type { FeedPost } from "@/lib/types";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await requireUser();
  const [{ data }, { data: like }, { data: canPost }] = await Promise.all([
    supabase.from("posts").select(FEED_SELECT).eq("id", id).maybeSingle(),
    supabase.from("likes").select("post_id").eq("post_id", id).eq("user_id", user.id).maybeSingle(),
    supabase.rpc("has_access"),
  ]);
  if (!data) notFound();
  const post = { ...(data as FeedPost), liked: !!like };
  return (
    <div className="-mx-4 -mb-28 -mt-5 md:m-0">
      <Link href="/battles" className="absolute z-20 m-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-sm text-pure backdrop-blur md:static md:m-0 md:mb-3 md:bg-transparent md:p-0 md:text-mute"><ChevronLeft className="size-4" /> Battles</Link>
      <div className="h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom)-env(safe-area-inset-top))] md:h-[calc(100dvh-10rem)]">
        <BottlePost post={post} userId={user.id} isAdmin={profile.role === "admin"} canInteract={!!canPost} />
      </div>
    </div>
  );
}
