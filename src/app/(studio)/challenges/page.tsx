import { Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { Leaderboard, type LeaderRow } from "@/components/challenges/Leaderboard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Challenge } from "@/lib/types";

export const metadata = { title: "Challenges" };

export default async function ChallengesPage() {
  const { supabase, user } = await requireUser();
  const [{ data: challenges }, { data: parts }, { data: board }] = await Promise.all([
    supabase.from("challenges").select("*").neq("status", "draft").order("status").order("end_date"),
    supabase.from("challenge_participants").select("challenge_id, user_id"),
    supabase.rpc("weekly_leaderboard", { p_limit: 10 }),
  ]);
  const count = (id: string) => (parts ?? []).filter((p) => p.challenge_id === id).length;
  const joined = (id: string) => (parts ?? []).some((p) => p.challenge_id === id && p.user_id === user.id);

  return (
    <>
      <PageHeader eyebrow="Create" title="Challenges" subtitle="Short sprints that turn lessons into habits." />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {(challenges as Challenge[] | null)?.map((c) => <ChallengeCard key={c.id} c={c} participants={count(c.id)} joined={joined(c.id)} />)}
          {!challenges?.length && <div className="sm:col-span-2"><EmptyState icon={Trophy} title="No challenges yet." body="New challenges drop regularly. Check back soon." /></div>}
        </div>
        <section id="leaderboard" className="scroll-mt-24">
          <p className="eyebrow mb-2">Weekly leaderboard</p>
          <h2 className="h-display mb-1 text-3xl">Creator of the Week</h2>
          <p className="mb-4 text-xs text-mute">Points: challenge entry 10 · video 5 · comment 2 · like 1 · featured 25</p>
          <Leaderboard rows={(board ?? []) as LeaderRow[]} />
        </section>
      </div>
    </>
  );
}
