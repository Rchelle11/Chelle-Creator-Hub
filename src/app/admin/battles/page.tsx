import Link from "next/link";
import { EyeOff, Eye, Pin, PinOff, Star, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Badge } from "@/components/ui/PageHeader";
import { FilterTabs } from "@/components/admin/AdminTable";
import { ActionButton } from "@/components/admin/ActionButton";
import { adminDeleteComment, adminDeletePost, moderatePost } from "@/lib/actions/admin";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Battles Moderation" };

export default async function BottleModeration({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "", q = "" } = await searchParams;
  const { supabase } = await requireAdmin();
  let query = supabase.from("posts").select("*, author:profiles!posts_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(60);
  if (status === "featured") query = query.eq("featured", true);
  else if (status === "pinned") query = query.eq("pinned", true);
  else if (status) query = query.eq("status", status);
  if (q) query = query.ilike("caption", `%${q}%`);
  const [{ data: posts }, { data: comments }] = await Promise.all([
    query,
    supabase.from("comments").select("id, content, created_at, post_id, author:profiles(full_name)").order("created_at", { ascending: false }).limit(15),
  ]);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Battles Moderation" subtitle="Feature great work, pin highlights, hide what doesn't belong." />
      <form className="mb-4"><input type="hidden" name="status" value={status} /><input name="q" defaultValue={q} placeholder="Search captions…" className="input max-w-md" /></form>
      <FilterTabs base={`/admin/battles${q ? `?q=${encodeURIComponent(q)}` : ""}`} active={status}
        tabs={[{ id: "", label: "All" }, { id: "published", label: "Published" }, { id: "hidden", label: "Hidden" }, { id: "featured", label: "Featured" }, { id: "pinned", label: "Pinned" }]} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(posts ?? []).map((p) => (
            <div key={p.id} className="glass overflow-hidden">
              <Link href={`/battles/${p.id}`} className="relative block aspect-[9/16] bg-black">
                <video src={p.video_url} poster={p.poster_url ?? undefined} muted playsInline preload="metadata" className="size-full object-cover" />
                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                  {p.featured && <Badge tone="gold">★ Featured</Badge>}{p.pinned && <Badge tone="gold">Pinned</Badge>}{p.status !== "published" && <Badge tone="bad">{p.status}</Badge>}
                </div>
              </Link>
              <div className="p-2.5">
                <p className="truncate text-xs font-semibold">{p.author?.full_name}</p>
                <p className="truncate text-[11px] text-mute">{p.caption || "—"}</p>
                <p className="text-[11px] text-mute">♥ {p.like_count} · 💬 {p.comment_count} · {timeAgo(p.created_at)}</p>
                <div className="mt-2 grid grid-cols-4 gap-1">
                  <ActionButton title={p.featured ? "Unfeature" : "Feature"} className={`btn-quiet btn-sm px-0 ${p.featured ? "text-gold" : ""}`} action={moderatePost.bind(null, p.id, { featured: !p.featured })}><Star className={`size-4 ${p.featured ? "fill-current" : ""}`} /></ActionButton>
                  <ActionButton title={p.pinned ? "Unpin" : "Pin"} className="btn-quiet btn-sm px-0" action={moderatePost.bind(null, p.id, { pinned: !p.pinned })}>{p.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}</ActionButton>
                  <ActionButton title={p.status === "hidden" ? "Approve / show" : "Hide"} className="btn-quiet btn-sm px-0" action={moderatePost.bind(null, p.id, { status: p.status === "published" ? "hidden" : "published" })}>{p.status === "published" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</ActionButton>
                  <ActionButton title="Delete" className="btn-quiet btn-sm px-0 text-bad" confirm="Delete this post permanently?" action={adminDeletePost.bind(null, p.id)}><Trash2 className="size-4" /></ActionButton>
                </div>
              </div>
            </div>
          ))}
          {!posts?.length && <p className="col-span-full py-12 text-center text-sm text-mute">No posts.</p>}
        </div>
        <section className="glass h-fit p-4">
          <h2 className="label mb-3">Recent comments</h2>
          <div className="space-y-3">
            {(comments ?? []).map((c) => (
              <div key={c.id} className="flex gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="text-xs"><b>{(c.author as unknown as { full_name: string })?.full_name}</b> <span className="text-mute">· {timeAgo(c.created_at)}</span></p>
                  <Link href={`/battles/${c.post_id}`} className="line-clamp-2 text-soft hover:text-white">{c.content}</Link>
                </div>
                <ActionButton title="Delete comment" className="btn-quiet btn-sm px-2 text-bad" confirm="Delete this comment?" action={adminDeleteComment.bind(null, c.id, "comments")}><Trash2 className="size-3.5" /></ActionButton>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
