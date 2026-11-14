"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ImagePlus, Loader2, QrCode, ShieldCheck, Tag, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { quotePrice, submitPayment, type Quote } from "@/lib/actions/payments";
import { compressImage, fileExt, uniqueName, uploadFile } from "@/lib/upload";
import type { PaymentMethod } from "@/lib/types";
import { cn, peso } from "@/lib/utils";

const PAY = {
  gcash: { name: process.env.NEXT_PUBLIC_GCASH_NAME ?? "Rochelle S.", number: process.env.NEXT_PUBLIC_GCASH_NUMBER ?? "0917 123 4567", qr: process.env.NEXT_PUBLIC_GCASH_QR_URL },
  gotyme: { name: process.env.NEXT_PUBLIC_GOTYME_NAME ?? "Rochelle S.", account: process.env.NEXT_PUBLIC_GOTYME_ACCOUNT ?? "0123 4567 8901", qr: process.env.NEXT_PUBLIC_GOTYME_QR_URL },
  paypal: { link: process.env.NEXT_PUBLIC_PAYPAL_LINK ?? "https://paypal.me/", usd: process.env.NEXT_PUBLIC_PAYPAL_USD_PRICE ?? "99" },
};
const METHODS: { id: PaymentMethod; label: string; note: string }[] = [
  { id: "gcash", label: "GCash", note: "Instant · PH" },
  { id: "gotyme", label: "GoTyme", note: "Bank transfer · PH" },
  { id: "paypal", label: "PayPal", note: "International" },
];

export function CheckoutFlow({ course, userId, defaultName }: {
  course: { id: string; title: string; price: number; thumbnail_url: string | null }; userId: string; defaultName: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote>({ valid: null, amount: course.price, original: course.price });
  const [code, setCode] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("gcash");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [applying, startApply] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const apply = () => startApply(async () => {
    const r = await quotePrice(course.id, code.trim());
    if (!r.ok) return toast(r.error, "error");
    setQuote(r.data!);
    if (r.data!.valid) toast(`Code applied — you save ${peso(r.data!.discount ?? 0, { decimals: true })}.`);
    else if (r.data!.valid === false) toast(r.data!.message ?? "Invalid code.", "error");
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!file) return toast("Please attach your receipt screenshot.", "error");
    setSubmitting(true);
    try {
      const blob = await compressImage(file);
      const ext = blob === file ? fileExt(file, "jpg") : "jpg";
      const { path } = await uploadFile("receipts", `${userId}/${uniqueName(ext)}`, blob, setProgress);
      const r = await submitPayment({
        courseId: course.id, method, reference: String(f.get("reference")), senderName: String(f.get("sender_name")),
        senderNumber: String(f.get("sender_number") ?? ""), receiptPath: path, code: quote.valid ? quote.code : undefined,
      });
      if (!r.ok) throw new Error(r.error);
      toast("Payment submitted successfully.");
      router.push("/payment-status?submitted=1");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong. Please try again.", "error");
      setSubmitting(false); setProgress(null);
    }
  }

  const copy = (v: string) => { navigator.clipboard.writeText(v.replace(/\s/g, "")); toast("Copied."); };
  const amount = peso(quote.amount, { decimals: true });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6 lg:order-1">
        {/* STEP 1 */}
        <section className="glass p-5 md:p-7">
          <p className="eyebrow">Step 1</p>
          <h2 className="mt-1 text-xl font-semibold">Pay with {METHODS.find((m) => m.id === method)!.label}</h2>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                className={cn("rounded-xl border p-3 text-left transition", method === m.id ? "border-accent bg-accent/10" : "border-line hover:border-line-2")}>
                <span className="block text-sm font-semibold">{m.label}</span>
                <span className="block text-[11px] text-mute">{m.note}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 grid items-center gap-6 md:grid-cols-[200px_1fr]">
            {method !== "paypal" ? (
              <div className="mx-auto grid aspect-square w-48 place-items-center overflow-hidden rounded-2xl bg-pure p-3 md:w-full">
                {PAY[method].qr
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={PAY[method].qr} alt={`${method} QR code`} className="size-full object-contain" />
                  : <div className="grid size-full place-items-center rounded-xl border-2 border-dashed border-black/20 text-center text-[11px] text-black/50"><span><QrCode className="mx-auto mb-1 size-10" />Set NEXT_PUBLIC_{method.toUpperCase()}_QR_URL</span></div>}
              </div>
            ) : null}
            <div className={cn(method === "paypal" && "md:col-span-2")}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">Amount to pay</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight">{method === "paypal" ? `$${PAY.paypal.usd}` : amount}</p>
              {method === "gcash" && (
                <>
                  <p className="mt-3 text-sm text-soft">Scan the QR code to pay.</p>
                  <ol className="mt-3 list-decimal space-y-1 pl-4 text-sm text-mute">
                    <li>Open GCash → <b className="text-soft">Pay QR</b> (or Send Money)</li>
                    <li>Pay exactly <b className="text-soft">{amount}</b></li>
                    <li>Screenshot the receipt with the reference number</li>
                  </ol>
                  <Detail label="GCash name" value={PAY.gcash.name} />
                  <Detail label="GCash number" value={PAY.gcash.number} onCopy={copy} />
                </>
              )}
              {method === "gotyme" && (
                <>
                  <p className="mt-3 text-sm text-soft">Transfer via GoTyme Bank or InstaPay from any bank.</p>
                  <Detail label="Account name" value={PAY.gotyme.name} />
                  <Detail label="Account number" value={PAY.gotyme.account} onCopy={copy} />
                </>
              )}
              {method === "paypal" && (
                <>
                  <p className="mt-3 text-sm text-soft">For international students. Send as <b>Friends &amp; Family</b> or Goods &amp; Services, then upload your PayPal receipt below.</p>
                  <a href={PAY.paypal.link} target="_blank" rel="noreferrer" className="btn-ghost mt-4">Open PayPal</a>
                </>
              )}
            </div>
          </div>
        </section>

        {/* STEP 2 */}
        <form onSubmit={onSubmit} className="glass space-y-4 p-5 md:p-7">
          <div>
            <p className="eyebrow">Step 2</p>
            <h2 className="mt-1 text-xl font-semibold">Upload Your Receipt</h2>
          </div>
          <div>
            <label className="label" htmlFor="reference">{method === "gcash" ? "GCash Reference No." : method === "paypal" ? "PayPal Transaction ID" : "Reference No."}</label>
            <input id="reference" name="reference" required minLength={4} inputMode={method === "paypal" ? "text" : "numeric"} className="input" placeholder="e.g. 1029 384 756" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="sender_name">Sender Name</label>
              <input id="sender_name" name="sender_name" required defaultValue={defaultName} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="sender_number">{method === "paypal" ? "PayPal Email" : "Sender Number"}</label>
              <input id="sender_number" name="sender_number" required={method !== "paypal"} inputMode={method === "paypal" ? "email" : "tel"} className="input" placeholder={method === "paypal" ? "you@email.com" : "09XX XXX XXXX"} />
            </div>
          </div>
          <div>
            <span className="label">Receipt Screenshot</span>
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 10 * 1024 * 1024) return toast("Max 10MB.", "error"); setFile(f); setPreview(URL.createObjectURL(f)); }} />
            {preview ? (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Receipt preview" className="max-h-72 rounded-xl border border-line" />
                <button type="button" onClick={() => { setFile(null); setPreview(null); }} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full text-pure bg-black/70" aria-label="Remove"><X className="size-4" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line-2 px-4 py-10 text-sm text-mute transition hover:border-accent/50 hover:text-white">
                <ImagePlus className="size-7 text-accent" /> Tap to upload from gallery
              </button>
            )}
          </div>
          {progress !== null && <div><ProgressBar value={progress} size="sm" /><p className="mt-1 text-xs text-mute">Uploading receipt… {progress}%</p></div>}
          <button disabled={submitting} className="btn-primary h-13 w-full text-[15px]">
            {submitting ? <Loader2 className="size-5 animate-spin" /> : <ShieldCheck className="size-5" />} Submit Payment for Confirmation
          </button>
          <p className="text-center text-xs text-mute">We&apos;ll review your payment and unlock your course — usually within a few hours.</p>
        </form>
      </div>

      {/* Summary */}
      <aside className="lg:order-2 lg:sticky lg:top-24 lg:self-start">
        <div className="glass overflow-hidden">
          {course.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnail_url} alt="" className="aspect-video w-full object-cover" />
          )}
          <div className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">Course</p>
            <p className="mt-1 text-lg font-semibold">{course.title}</p>
            <div className="mt-5">
              <span className="label">Discount code</span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mute" />
                  <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="input pl-10 uppercase" placeholder="CODE" />
                </div>
                <button type="button" onClick={apply} disabled={!code || applying} className="btn-ghost h-12">{applying ? <Loader2 className="size-4 animate-spin" /> : "Apply"}</button>
              </div>
            </div>
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-mute"><dt>Subtotal</dt><dd>{peso(quote.original, { decimals: true })}</dd></div>
              {quote.valid && <div className="flex justify-between text-ok"><dt>Discount ({quote.code})</dt><dd>−{peso(quote.discount ?? 0, { decimals: true })}</dd></div>}
              <div className="flex justify-between pt-2 text-lg font-semibold"><dt>Total</dt><dd>{amount}</dd></div>
            </dl>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Detail({ label, value, onCopy }: { label: string; value: string; onCopy?: (v: string) => void }) {
  const [c, setC] = useState(false);
  return (
    <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-white/[0.03] px-4 py-2.5">
      <div><p className="text-[10px] uppercase tracking-[0.14em] text-mute">{label}</p><p className="font-semibold">{value}</p></div>
      {onCopy && <button type="button" onClick={() => { onCopy(value); setC(true); setTimeout(() => setC(false), 1500); }} className="btn-quiet btn-sm">{c ? <Check className="size-4 text-ok" /> : <Copy className="size-4" />}</button>}
    </div>
  );
}
