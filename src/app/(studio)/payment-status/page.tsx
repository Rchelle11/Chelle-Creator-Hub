import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, XCircle, Receipt } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader, Badge } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtDate, peso } from "@/lib/utils";

export const metadata = { title: "Payment Status" };

export default async function PaymentStatus() {
  const { supabase, user } = await requireUser();
  const { data: payments } = await supabase.from("payments").select("*, course:courses(title, slug)")
    .eq("user_id", user.id).order("submitted_at", { ascending: false });
  const latest = payments?.[0];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Billing" title="Payment Status" />
      {!latest && <EmptyState icon={Receipt} title="No payments yet." cta="Explore Courses" href="/courses" />}

      {latest?.status === "pending" && (
        <section className="glass p-6 text-center md:p-10">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-warn/15"><Clock className="size-8 text-warn" /></div>
          <h2 className="h-display mt-5 text-4xl">Payment Submitted</h2>
          <p className="mt-3 text-soft">Your payment is currently being reviewed.</p>
          <p className="mt-1 text-sm text-mute">You will receive access once your payment has been confirmed.</p>
          <div className="mt-6"><Badge tone="warn">● Pending</Badge></div>
        </section>
      )}
      {latest?.status === "approved" && (
        <section className="glass p-6 text-center md:p-10">
          <div className="mx-auto grid size-16 animate-pop place-items-center rounded-full bg-ok/15"><CheckCircle2 className="size-8 text-ok" /></div>
          <h2 className="h-display mt-5 text-4xl">🎉 Payment confirmed!</h2>
          <p className="mt-3 text-soft">Welcome to the {latest.course?.title}.</p>
          <Link href={`/courses/${latest.course?.slug}`} className="btn-primary mt-6">Start Learning <ArrowRight className="size-4" /></Link>
        </section>
      )}
      {latest?.status === "rejected" && (
        <section className="glass p-6 text-center md:p-10">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-bad/15"><XCircle className="size-8 text-bad" /></div>
          <h2 className="h-display mt-5 text-4xl">Payment not confirmed</h2>
          {latest.rejection_reason && <p className="mx-auto mt-3 max-w-md rounded-xl border border-bad/20 bg-bad/10 p-3 text-sm text-soft">{latest.rejection_reason}</p>}
          <Link href={`/checkout/${latest.course?.slug}`} className="btn-primary mt-6">Resubmit payment</Link>
        </section>
      )}

      {!!payments?.length && (
        <section className="mt-8">
          <h3 className="label mb-3">History</h3>
          <div className="glass divide-y divide-line">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium">{p.course?.title}</p>
                  <p className="text-xs text-mute">{p.method.toUpperCase()} · Ref {p.reference_number} · {fmtDate(p.submitted_at, true)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{peso(p.amount, { decimals: true })}</p>
                  <Badge tone={p.status === "approved" ? "ok" : p.status === "rejected" ? "bad" : "warn"}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
