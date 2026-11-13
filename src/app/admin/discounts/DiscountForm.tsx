"use client";
import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { saveDiscount } from "@/lib/actions/admin";

export function DiscountForm() {
  const toast = useToast(); const router = useRouter(); const form = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  return (
    <form ref={form} className="glass grid gap-4 p-5 sm:grid-cols-2" action={(f) => start(async () => {
      const type = String(f.get("type")); const value = Number(f.get("value"));
      const exp = String(f.get("expires_at") || "");
      const r = await saveDiscount({ code: String(f.get("code")), percent_off: type === "percent" ? value : null, amount_off: type === "amount" ? value : null,
        max_uses: f.get("max_uses") ? Number(f.get("max_uses")) : null, expires_at: exp ? new Date(exp).toISOString() : null, course_id: null });
      if (!r.ok) return toast(r.error, "error");
      toast(r.message ?? "Saved."); form.current?.reset(); router.refresh();
    })}>
      <div><label className="label">Code</label><input name="code" required className="input uppercase" placeholder="CREATOR20" /></div>
      <div className="grid grid-cols-[1fr_110px] gap-2">
        <div><label className="label">Value</label><input name="value" type="number" min={1} step="0.01" required className="input" placeholder="20" /></div>
        <div><label className="label">Type</label><select name="type" className="input"><option value="percent">% off</option><option value="amount">₱ off</option></select></div>
      </div>
      <div><label className="label">Max uses</label><input name="max_uses" type="number" min={1} className="input" placeholder="Unlimited" /></div>
      <div><label className="label">Expires</label><input name="expires_at" type="datetime-local" className="input" /></div>
      <button disabled={pending} className="btn-primary sm:col-span-2">{pending && <Loader2 className="size-4 animate-spin" />} Create code</button>
    </form>
  );
}
