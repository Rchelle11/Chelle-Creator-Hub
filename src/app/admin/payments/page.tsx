import { requireAdmin } from "@/lib/auth";
import { PageHeader, Badge } from "@/components/ui/PageHeader";
import { AdminTable, FilterTabs } from "@/components/admin/AdminTable";
import { PaymentCard, type AdminPayment } from "@/components/admin/PaymentReview";
import { fmtDate, peso } from "@/lib/utils";

export const metadata = { title: "Payments" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "pending", q = "" } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.rpc("admin_payments");
  const all = (data ?? []) as Omit<AdminPayment, "receipt_url">[] & { receipt_path: string }[];
  const needle = q.toLowerCase();
  const list = all.filter((p) => (status === "all" || p.status === status) &&
    (!needle || [p.full_name, p.email, p.reference_number, p.sender_name].some((v) => v?.toLowerCase().includes(needle))));

  // Receipts live in a private bucket → short-lived signed URLs for the admin only.
  const paths = list.filter((p) => p.status === "pending").map((p) => (p as unknown as { receipt_path: string }).receipt_path);
  const { data: signed } = paths.length ? await supabase.storage.from("receipts").createSignedUrls(paths, 60 * 30) : { data: [] };
  const urlFor = (path: string) => signed?.find((s) => s.path === path)?.signedUrl ?? null;
  const count = (s: string) => all.filter((p) => p.status === s).length;

  return (
    <>
      <PageHeader eyebrow="Admin" title="Payment Verification" subtitle="Approve to enroll students instantly." />
      <form className="mb-4"><input type="hidden" name="status" value={status} /><input name="q" defaultValue={q} placeholder="Search name, email, reference…" className="input max-w-md" /></form>
      <FilterTabs base={`/admin/payments${q ? `?q=${encodeURIComponent(q)}` : ""}`} active={status}
        tabs={[{ id: "pending", label: "Pending", count: count("pending") }, { id: "approved", label: "Approved", count: count("approved") }, { id: "rejected", label: "Rejected", count: count("rejected") }, { id: "all", label: "All", count: all.length }]} />

      {status === "pending" ? (
        <div className="space-y-4">
          {list.map((p) => <PaymentCard key={p.id} p={{ ...p, receipt_url: urlFor((p as unknown as { receipt_path: string }).receipt_path) } as AdminPayment} />)}
          {!list.length && <p className="glass p-12 text-center text-sm text-mute">🎉 No pending payments. You&apos;re all caught up.</p>}
        </div>
      ) : (
        <AdminTable head={["Student", "Course", "Amount", "Method", "Reference", "Status", "Date"]} empty={!list.length}>
          {list.map((p) => (
            <tr key={p.id}>
              <td><p className="font-medium">{p.full_name}</p><p className="text-xs text-mute">{p.email}</p></td>
              <td>{p.course_title}</td>
              <td className="font-semibold">{peso(p.amount, { decimals: true })}</td>
              <td className="uppercase">{p.method}</td>
              <td className="font-mono text-xs">{p.reference_number}</td>
              <td><Badge tone={p.status === "approved" ? "ok" : p.status === "rejected" ? "bad" : "warn"}>{p.status}</Badge></td>
              <td className="text-xs text-mute">{fmtDate(p.submitted_at, true)}</td>
            </tr>
          ))}
        </AdminTable>
      )}
    </>
  );
}
