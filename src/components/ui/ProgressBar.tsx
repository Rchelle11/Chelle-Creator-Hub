import { cn } from "@/lib/utils";

export function ProgressBar({ value, className, size = "md" }: { value: number; className?: string; size?: "sm" | "md" }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-white/[0.07]", size === "sm" ? "h-1.5" : "h-2.5", className)}
      role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-accent to-gold transition-[width] duration-1000 ease-out"
        style={{ width: `${v}%` }} />
    </div>
  );
}

export function ProgressRing({ value, size = 64 }: { value: number; size?: number }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-accent)" strokeWidth="6" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} className="transition-[stroke-dashoffset] duration-1000" />
    </svg>
  );
}
