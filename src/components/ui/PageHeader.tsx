export function PageHeader({ eyebrow, title, subtitle, action }: {
  eyebrow?: string; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex animate-fade-up flex-wrap items-end justify-between gap-4 md:mb-8">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="h-display text-[34px] leading-[1.05] md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-sm text-mute md:text-base">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatCard({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="glass glass-hover p-4 md:p-5">
      <div className="flex items-center justify-between text-mute">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{value}</div>
      {hint && <div className="mt-1 text-xs text-mute">{hint}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "ok" | "warn" | "bad" | "accent" | "gold" }) {
  const tones = {
    neutral: "border-line bg-white/[0.05] text-soft",
    ok: "border-ok/25 bg-ok/10 text-ok",
    warn: "border-warn/25 bg-warn/10 text-warn",
    bad: "border-bad/25 bg-bad/10 text-bad",
    accent: "border-accent/30 bg-accent/10 text-accent-2",
    gold: "border-gold/30 bg-gold/10 text-gold",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}
