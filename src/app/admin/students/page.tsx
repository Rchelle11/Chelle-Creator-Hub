import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Badge } from "@/components/ui/PageHeader";
import { AdminTable, FilterTabs } from "@/components/admin/AdminTable";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { fmtDate, timeAgo } from "@/lib/utils";

export const metadata = { title: "Students" };
type Row = { id: string; full_name: string; email: string; avatar_url: string | null; status: string; role: string; created_at: string; last_active_at: string; progress: number; enrolled: boolean; payment_status: string | null };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status = "" } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.rpc("admin_students");
  const all = ((data ?? []) as Row[]).filter((s) => s.role === "student");
  const n = q.toLowerCase();
  const list = all.filter((s) => (!n || s.full_name.toLowerCase().includes(n) || s.email.toLowerCase().includes(n)) &&
    (!status || (status === "enrolled" ? s.enrolled : status === "not-enrolled" ? !s.enrolled && s.payment_status !== "pending" : status === "pending" ? s.payment_status === "pending" : s.status === status)));

  return (
    <>
      <PageHeader eyebrow="Admin" title="Students" subtitle={`${all.length} total · ${all.filter((s) => s.enrolled).length} enrolled`} />
      <form className="mb-4"><input type="hidden" name="status" value={status} /><input name="q" defaultValue={q} placeholder="Search by name or email…" className="input max-w-md" /></form>
      <FilterTabs base={`/admin/students${q ? `?q=${encodeURIComponent(q)}` : ""}`} active={status}
        tabs={[{ id: "", label: "All" }, { id: "enrolled", label: "Enrolled" }, { id: "pending", label: "Payment pending" }, { id: "not-enrolled", label: "Not enrolled" }, { id: "suspended", label: "Suspended" }]} />
      <AdminTable head={["Name", "Email", "Joined", "Payment", "Progress", "Last active", ""]} empty={!list.length}>
        {list.map((s) => (
          <tr key={s.id}>
            <td><Link href={`/admin/students/${s.id}`} className="flex items-center gap-2.5 font-medium hover:text-accent"><Avatar name={s.full_name} src={s.avatar_url} size={30} />{s.full_name}{s.status === "suspended" && <Badge tone="bad">Suspended</Badge>}</Link></td>
            <td className="text-mute">{s.email}</td>
            <td className="text-xs text-mute">{fmtDate(s.created_at)}</td>
            <td>{s.payment_status ? <Badge tone={s.payment_status === "approved" ? "ok" : s.payment_status === "rejected" ? "bad" : "warn"}>{s.payment_status}</Badge> : <span className="text-xs text-mute">—</span>}</td>
            <td className="w-40">{s.enrolled ? <div className="flex items-center gap-2"><ProgressBar value={s.progress} size="sm" /><span className="text-xs">{s.progress}%</span></div> : <span className="text-xs text-mute">Not enrolled</span>}</td>
            <td className="text-xs text-mute">{timeAgo(s.last_active_at)}</td>
            <td><Link href={`/admin/students/${s.id}`} className="text-xs font-semibold text-accent">View</Link></td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
