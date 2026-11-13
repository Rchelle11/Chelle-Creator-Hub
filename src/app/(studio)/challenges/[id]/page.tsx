import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft, Circle, Lock, Upload, Crown } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { JoinButton } from "@/components/challenges/JoinButton";
import { daysLeft, daysSince } from "@/components/challenges/ChallengeCard";
import { PostGrid } from "@/components/bottle/PostGrid";
import { Badge } from "@/components/ui/PageHeader";
import type { Challenge } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: c } = await supabase.from("challenges").select("*").eq("id", id).maybeSingle<Challenge>();
  if (!c) notFound();
  const [{ data: me }, { data: subs }, { count }] = await Promise.all([
    supabase.from("challenge_participants").select("*").eq("challenge_id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("challenge_submissions").select("id, day, user_id, status, post:posts(id, video_url, poster_url, like_count, featured, status)").eq("challenge_id", id).order("created_at", { ascending: false }),
    supabase.from("challenge_participants").select("user_id", { count: "exact", head: true }).eq("challenge_id", id),
  ]);
  const mySubs = (subs ?? []).filter((s) => s.user_id === user.id);
  const done = new Set(mySubs.map((s) => s.day));
  // Days unlock one per calendar day from when the student joined.
  const unlocked = me ? Math.min(c.days, daysSince(me.joined_at) + 1) : 0;
  const open = c.status === "active" && daysLeft(c.end_date) >= 0;
  type SubPost = { id: string; video_url: string; poster_url: string | null; like_count: number; featured: boolean; status: string };
  const gallery = (subs ?? []).map((s) => s.post as unknown as SubPost | null).filter((p): p is SubPost => !!p && p.status === "published");
  const winners = (subs ?? []).filter((s) => s.status === "winner").map((s) => s.post as unknown as SubPost | null).filter((p): p is SubPost => !!p);

  return (
    <div className="space-y-8">
      <Link href="/challenges" className="inline-flex items-center gap-1 text-sm text-mute hover:text-white"><ChevronLeft className="size-4" /> Challenges</Link>
      <section className="relative overflow-hidden rounded-3xl border border-line">
        {c.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.cover_url} alt="" className="absolute inset-0 size-full object-cover opacity-35" />
        )}
        <div className="relative bg-gradient-to-t from-ink via-ink/85 to-ink/30 p-6 pt-20 md:p-10 md:pt-32">
          <div className="flex gap-2">{open ? <Badge tone="accent">● Live</Badge> : <Badge>Ended</Badge>}<Badge>{count ?? 0} creators</Badge></div>
          <h1 className="h-display mt-3 text-4xl md:text-6xl">{c.title}</h1>
          <p className="mt-3 max-w-xl text-soft">{c.description}</p>
          <p className="mt-3 text-xs text-mute">{fmtDate(c.start_date)} → Deadline {fmtDate(c.end_date)}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {!me && open && <JoinButton id={c.id} />}
            {me && open && done.size < c.days && <Link href={`/challenges/${c.id}/submit`} className="btn-primary"><Upload className="size-4" /> Submit Your Work</Link>}
            {me && done.size >= c.days && <Badge tone="ok">🏁 Challenge complete</Badge>}
          </div>
        </div>
      </section>

      {me && (
        <section>
          <h2 className="label mb-3">Your progress</h2>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {Array.from({ length: c.days }, (_, i) => i + 1).map((d) => {
              const state = done.has(d) ? "done" : d <= unlocked ? "open" : "locked";
              return (
                <div key={d} className={cn("flex min-w-[84px] flex-col items-center gap-2 rounded-2xl border p-3 text-center",
                  state === "done" ? "border-ok/30 bg-ok/10" : state === "open" ? "border-accent/40 bg-accent/5" : "border-line opacity-60")}>
                  <span className="text-[10px] font-bold tracking-[0.18em] text-mute">DAY {d}</span>
                  {state === "done" ? <Check className="size-5 text-ok" /> : state === "open" ? <Circle className="size-5 text-accent" /> : <Lock className="size-4 text-mute" />}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="glass p-5 md:p-6">
          <h2 className="label mb-3">Instructions</h2>
          <div className="whitespace-pre-line text-sm leading-relaxed text-soft">{c.instructions}</div>
        </section>
        {c.reference_video_url && (
          <section>
            <h2 className="label mb-3">Reference video</h2>
            <video src={c.reference_video_url} controls playsInline preload="metadata" className="aspect-video w-full rounded-2xl border border-line bg-black" />
          </section>
        )}
      </div>

      {winners.length > 0 && (
        <section>
          <h2 className="label mb-3 flex items-center gap-1.5 text-gold"><Crown className="size-4" /> Winners</h2>
          <PostGrid posts={winners} />
        </section>
      )}
      <section>
        <h2 className="label mb-3">Submissions</h2>
        {gallery.length ? <PostGrid posts={gallery} /> : <p className="text-sm text-mute">No submissions yet — be the first.</p>}
      </section>
    </div>
  );
}
