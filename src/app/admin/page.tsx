import Link from "next/link";
import { ArrowRight, Users, Activity, Clock, Wallet, GraduationCap, Clapperboard, MessageCircle, Heart, Sparkles, UserPlus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, StatCard } from "@/components/ui/PageHeader";
import { peso } from "@/lib/utils";

type Overview = {
  total_students: number; new_students_7d: number; active_students: number; enrolled_students: number; pending_payments: number;
  approved_payments: number; rejected_payments: number; total_sales: number; sales_30d: number; avg_progress: number; completion_rate: number;
  bottle_posts: number; comments: number; likes: number; active_creators: number;
  lesson_stats: { idx: number; title: string; completions: number; views: number }[];
  sales_by_day: { day: string; amount: number }[];
};

export default async function AdminOverview() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.rpc("admin_overview");
  const o = data as Overview;
  const maxSale = Math.max(1, ...o.sales_by_day.map((d) => Number(d.amount)));
  const maxDone = Math.max(1, ...o.lesson_stats.map((l) => l.completions));
  // Drop-off = biggest fall in completions between consecutive lessons.
  const drops = o.lesson_stats.slice(1).map((l, i) => ({ ...l, drop: o.lesson_stats[i].completions - l.completions })).sort((a, b) => b.drop - a.drop).slice(0, 3);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Dashboard" subtitle="Your masterclass at a glance." />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total students" value={o.total_students} hint={`+${o.new_students_7d} this week`} icon={<Users className="size-4" />} />
        <StatCard label="Active students" value={o.active_students} hint="last 14 days" icon={<Activity className="size-4" />} />
        <Link href="/admin/payments?status=pending"><StatCard label="Pending payments" value={<span className={o.pending_payments ? "text-warn" : ""}>{o.pending_payments}</span>} hint="Review now →" icon={<Clock className="size-4" />} /></Link>
        <StatCard label="Total sales" value={peso(o.total_sales)} hint={`${peso(o.sales_30d)} last 30d`} icon={<Wallet className="size-4" />} />
        <StatCard label="Course completion" value={`${o.completion_rate}%`} hint={`avg progress ${o.avg_progress}%`} icon={<GraduationCap className="size-4" />} />
        <StatCard label="Battles posts" value={o.bottle_posts} hint={`${o.active_creators} active creators`} icon={<Clapperboard className="size-4" />} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="glass p-5">
          <div className="flex items-end justify-between">
            <div><h2 className="label">Sales · last 14 days</h2><p className="text-2xl font-semibold">{peso(o.sales_by_day.reduce((a, d) => a + Number(d.amount), 0))}</p></div>
            <p className="text-xs text-mute">{o.approved_payments} approved · {o.rejected_payments} rejected</p>
          </div>
          <div className="mt-6 flex h-40 items-end gap-1.5">
            {o.sales_by_day.map((d) => (
              <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
                <div className="rounded-t-md bg-gradient-to-t from-accent/60 to-accent transition group-hover:to-gold" style={{ height: `${Math.max(2, (Number(d.amount) / maxSale) * 100)}%` }} />
                <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink-3 px-2 py-1 text-[10px] group-hover:block">{peso(d.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-mute"><span>{new Date(o.sales_by_day[0]?.day).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</span><span>Today</span></div>
        </section>

        <section className="glass p-5">
          <h2 className="label">Community</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[["Posts", o.bottle_posts, Clapperboard], ["Comments", o.comments, MessageCircle], ["Likes", o.likes, Heart], ["Active creators", o.active_creators, Sparkles], ["Enrolled", o.enrolled_students, GraduationCap], ["New (7d)", o.new_students_7d, UserPlus]].map(([l, v, I]) => {
              const Icon = I as typeof Heart;
              return <div key={l as string} className="rounded-xl border border-line p-3"><Icon className="size-4 text-accent" /><p className="mt-2 text-xl font-semibold">{v as number}</p><p className="text-[11px] text-mute">{l as string}</p></div>;
            })}
          </div>
        </section>
      </div>

      <section className="glass p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="label">Learning · completions per lesson</h2>
          {drops[0]?.drop > 0 && <p className="text-xs text-mute">Biggest drop-off: <span className="text-warn">{drops.filter((d) => d.drop > 0).map((d) => `#${d.idx} ${d.title} (−${d.drop})`).join(" · ")}</span></p>}
        </div>
        <div className="mt-4 space-y-1.5">
          {o.lesson_stats.map((l) => (
            <div key={l.idx} className="grid grid-cols-[28px_minmax(0,1fr)_40px] items-center gap-3 text-xs md:grid-cols-[28px_260px_minmax(0,1fr)_40px]">
              <span className="text-mute">{l.idx}</span>
              <span className="truncate">{l.title}</span>
              <div className="hidden h-2 overflow-hidden rounded-full bg-white/[0.05] md:block"><div className="h-full rounded-full bg-accent/80" style={{ width: `${(l.completions / maxDone) * 100}%` }} /></div>
              <span className="text-right font-semibold">{l.completions}</span>
            </div>
          ))}
        </div>
        <Link href="/admin/students" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">Student progress <ArrowRight className="size-4" /></Link>
      </section>
    </div>
  );
}
