import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Badge } from "@/components/ui/PageHeader";
import { ChallengeForm } from "@/components/admin/ChallengeForm";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Challenges" };

export default async function AdminChallenges() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("challenges").select("*, challenge_participants(count), challenge_submissions(count)").order("created_at", { ascending: false });
  return (
    <>
      <PageHeader eyebrow="Admin" title="Challenges" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          {(data ?? []).map((c) => (
            <Link key={c.id} href={`/admin/challenges/${c.id}`} className="glass glass-hover block p-4">
              <div className="flex items-center justify-between gap-2"><p className="font-semibold">{c.title}</p><Badge tone={c.status === "active" ? "accent" : "neutral"}>{c.status}</Badge></div>
              <p className="mt-1 text-xs text-mute">{fmtDate(c.start_date)} → {fmtDate(c.end_date)} · {c.days} days · {c.challenge_participants[0]?.count ?? 0} joined · {c.challenge_submissions[0]?.count ?? 0} submissions</p>
            </Link>
          ))}
        </div>
        <div><h2 className="label mb-3">Create challenge</h2><ChallengeForm /></div>
      </div>
    </>
  );
}
