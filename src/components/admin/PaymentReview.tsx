"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X, ZoomIn } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { approvePayment, rejectPayment } from "@/lib/actions/admin";
import { fmtDate, peso } from "@/lib/utils";

export type AdminPayment = {
  id: string; full_name: string; email: string; course_title: string; amount: number; original_amount: number; method: string;
  reference_number: string; sender_name: string; sender_number: string; receipt_url: string | null; status: "pending" | "approved" | "rejected";
  rejection_reason: string | null; submitted_at: string; discount_code: string | null;
};

const REASONS = ["Receipt is unclear. Please submit a clearer screenshot.", "Reference number doesn't match our records.", "Amount paid is incomplete."];

export function PaymentCard({ p }: { p: AdminPayment }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => start(async () => {
    const r = await fn();
    if (r.ok) { toast(r.message ?? "Done."); setRejecting(false); router.refresh(); } else toast(r.error ?? "Error", "error");
  });

  return (
    <article className="glass grid gap-5 p-4 md:grid-cols-[180px_minmax(0,1fr)] md:p-5">
      <button onClick={() => setZoom(true)} disabled={!p.receipt_url} className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-line bg-ink-3">
        {p.receipt_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={p.receipt_url} alt="Receipt" className="size-full object-cover" />
          : <span className="grid size-full place-items-center text-xs text-mute">No receipt image</span>}
        {p.receipt_url && <span className="absolute inset-0 grid place-items-center text-pure bg-black/50 opacity-0 transition group-hover:opacity-100"><ZoomIn className="size-6" /></span>}
      </button>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><p className="font-semibold">{p.full_name}</p><p className="text-xs text-mute">{p.email}</p></div>
          <Badge tone={p.status === "approved" ? "ok" : p.status === "rejected" ? "bad" : "warn"}>{p.status}</Badge>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          {[["Course", p.course_title], ["Amount", peso(p.amount, { decimals: true }) + (p.discount_code ? ` (${p.discount_code})` : "")], ["Method", p.method.toUpperCase()],
            ["Reference No.", p.reference_number], ["Sender name", p.sender_name], ["Sender number", p.sender_number || "—"], ["Submitted", fmtDate(p.submitted_at, true)]].map(([k, v]) => (
            <div key={k}><dt className="text-[10px] uppercase tracking-[0.14em] text-mute">{k}</dt><dd className="mt-0.5 break-words font-medium">{v}</dd></div>
          ))}
        </dl>
        {p.rejection_reason && <p className="mt-3 rounded-lg border border-bad/20 bg-bad/10 p-2.5 text-xs text-soft">Reason: {p.rejection_reason}</p>}
        {p.status === "pending" && (
          <div className="mt-5 flex gap-2">
            <button disabled={pending} onClick={() => run(() => approvePayment(p.id))} className="btn-primary flex-1 sm:flex-none">{pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve</button>
            <button disabled={pending} onClick={() => setRejecting(true)} className="btn-danger flex-1 sm:flex-none"><X className="size-4" /> Reject</button>
          </div>
        )}
      </div>

      <Modal open={rejecting} onClose={() => setRejecting(false)} title="Reject payment">
        <div className="space-y-3">
          {REASONS.map((r) => <button key={r} type="button" onClick={() => setReason(r)} className={`chip w-full justify-start py-2 text-left ${reason === r ? "border-accent/50 text-white" : ""}`}>{r}</button>)}
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="input" />
          <button disabled={pending} onClick={() => run(() => rejectPayment(p.id, reason))} className="btn-danger w-full">{pending && <Loader2 className="size-4 animate-spin" />} Reject & notify student</button>
        </div>
      </Modal>
      <Modal open={zoom} onClose={() => setZoom(false)} title="Receipt" className="md:max-w-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.receipt_url && <img src={p.receipt_url} alt="Receipt" className="mx-auto max-h-[75dvh] rounded-xl" />}
      </Modal>
    </article>
  );
}
