import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ShieldOff, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, StatCard } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ActionButton } from "@/components/admin/ActionButton";
import { MessageComposer } from "@/components/MessageComposer";
import { sendMessage, setStudentStatus } from "@/lib/actions/admin";
import { fmtDate, peso, timeAgo } from "@/lib/utils";

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: rows } = await supabase.rpc("admin_students");
  const s = (rows ?? []).find((r: { id: string }) => r.id === id) as { id: string; full_name: string; email: string; avatar_url: string | null; status: "active" | "suspended"; created_at: string; last_active_at: string; bio?: string } | undefined;
  if (!s) notFound();
  const [{ data: enrollments }, { data: payments }, { data: stats }, { data: progress }] = await Promise.all([
    supabase.from("enrollments").select("*, course:courses(title)").eq("user_id", id),
    supabase.from("payments").select("*").eq("user_id", id).order("submitted_at", { ascending: false }),
    supabase.rpc("creator_stats", { p_user: id }),
    supabase.from("lesson_progress").select("completed_at, lesson:lessons(title)").eq("user_id", id).eq("completed", true).order("completed_at", { ascending: false }).limit(8),
  ]);
  const st = stats as { videos: number; likes: number; challenges: number; lessons: number };

  return (
    <div className="space-y-6">
      <Link href="/admin/students" className="inline-flex items-center gap-1 text-sm text-mute hover:text-white"><ChevronLeft className="size-4" /> Students</Link>
      <header className="flex flex-wrap items-center gap-4">
        <Avatar name={s.full_name} src={s.avatar_url} size={72} />
        <div className="flex-1">
          <h1 className="h-display text-4xl">{s.full_name}</h1>
          <p className="text-sm text-mute">{s.email} · Joined {fmtDate(s.created_at)} · Active {timeAgo(s.last_active_at)}</p>
        </div>
        <Link href={`/u/${s.id}`} className="btn-ghost btn-sm">Public profile</Link>
        {s.status === "active"
          ? <ActionButton className="btn-danger btn-sm" confirm="Suspend this account? They will lose access." action={setStudentStatus.bind(null, s.id, "suspended")}><ShieldOff className="size-4" /> Suspend</ActionButton>
          : <ActionButton className="btn-ghost btn-sm" action={setStudentStatus.bind(null, s.id, "active")}><ShieldCheck className="size-4" /> Reactivate</ActionButton>}
      </header>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Lessons" value={st.lessons} /><StatCard label="Videos" value={st.videos} /><StatCard label="Challenges" value={st.challenges} /><StatCard label="Likes" value={st.likes} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass p-5">
          <h2 className="label mb-3">Enrolled courses</h2>
          {(enrollments ?? []).map((e) => (
            <div key={e.id} className="mb-3 rounded-xl border border-line p-3">
              <div className="flex justify-between text-sm"><span className="font-medium">{e.course?.title}</span><Badge tone={e.status === "completed" ? "ok" : "neutral"}>{e.status}</Badge></div>
              <ProgressBar value={e.progress_percent} size="sm" className="mt-2" /><p className="mt-1 text-xs text-mute">{e.progress_percent}% · enrolled {fmtDate(e.enrolled_at)}</p>
            </div>
          ))}
          {!enrollments?.length && <p className="text-sm text-mute">Not enrolled.</p>}
          <h2 className="label mb-2 mt-5">Recently completed</h2>
          <ul className="space-y-1 text-sm">{(progress ?? []).map((p, i) => <li key={i} className="flex justify-between"><span className="truncate">{(p.lesson as unknown as { title: string })?.title}</span><span className="text-xs text-mute">{timeAgo(p.completed_at!)}</span></li>)}</ul>
        </section>
        <section className="glass p-5">
          <h2 className="label mb-3">Payments</h2>
          {(payments ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b border-line/60 py-2.5 text-sm last:border-0">
              <span>{p.method.toUpperCase()} · {p.reference_number}<span className="block text-xs text-mute">{fmtDate(p.submitted_at, true)}</span></span>
              <span className="text-right">{peso(p.amount)}<br /><Badge tone={p.status === "approved" ? "ok" : p.status === "rejected" ? "bad" : "warn"}>{p.status}</Badge></span>
            </div>
          ))}
          {!payments?.length && <p className="text-sm text-mute">No payments.</p>}
          <h2 className="label mb-2 mt-6">Send a message</h2>
          <MessageComposer send={sendMessage.bind(null, s.id)} placeholder={`Message ${s.full_name.split(" ")[0]}…`} />
        </section>
      </div>
    </div>
  );
}
