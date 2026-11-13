import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Crown, Star } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Badge } from "@/components/ui/PageHeader";
import { ChallengeForm } from "@/components/admin/ChallengeForm";
import { ActionButton } from "@/components/admin/ActionButton";
import { setSubmissionStatus } from "@/lib/actions/admin";
import { timeAgo } from "@/lib/utils";

export default async function AdminChallenge({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: c } = await supabase.from("challenges").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();
  const { data: subs } = await supabase.from("challenge_submissions")
    .select("*, author:profiles(full_name), post:posts(id, video_url, poster_url, caption, like_count)").eq("challenge_id", id).order("created_at", { ascending: false });
  return (
    <>
      <Link href="/admin/challenges" className="mb-4 inline-flex items-center gap-1 text-sm text-mute hover:text-white"><ChevronLeft className="size-4" /> Challenges</Link>
      <PageHeader eyebrow="Challenge" title={c.title} action={<Link href={`/challenges/${c.id}`} className="btn-ghost btn-sm">View as student</Link>} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section>
          <h2 className="label mb-3">Submissions · {subs?.length ?? 0}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(subs ?? []).map((s) => (
              <div key={s.id} className="glass overflow-hidden">
                <Link href={s.post ? `/bottle/${s.post.id}` : "#"} className="relative block aspect-[9/16] bg-black">
                  {s.post && <video src={s.post.video_url} poster={s.post.poster_url ?? undefined} muted playsInline preload="metadata" className="size-full object-cover" />}
                  <span className="absolute left-2 top-2"><Badge tone={s.status === "winner" ? "gold" : s.status === "featured" ? "accent" : "neutral"}>Day {s.day} · {s.status}</Badge></span>
                </Link>
                <div className="p-2.5">
                  <p className="truncate text-xs font-semibold">{(s.author as { full_name: string })?.full_name}</p>
                  <p className="text-[11px] text-mute">♥ {s.post?.like_count ?? 0} · {timeAgo(s.created_at)}</p>
                  {s.explanation && <p className="mt-1 line-clamp-2 text-[11px] text-soft">{s.explanation}</p>}
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    <ActionButton className="btn-quiet btn-sm px-0 text-gold" title="Mark winner" action={setSubmissionStatus.bind(null, s.id, s.status === "winner" ? "submitted" : "winner")}><Crown className="size-4" /></ActionButton>
                    <ActionButton className="btn-quiet btn-sm px-0" title="Feature" action={setSubmissionStatus.bind(null, s.id, s.status === "featured" ? "submitted" : "featured")}><Star className="size-4" /></ActionButton>
                  </div>
                </div>
              </div>
            ))}
            {!subs?.length && <p className="col-span-full text-sm text-mute">No submissions yet.</p>}
          </div>
        </section>
        <section><h2 className="label mb-3">Edit</h2><ChallengeForm initial={c} /></section>
      </div>
    </>
  );
}
