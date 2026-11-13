export function AdminTable({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="glass overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead><tr className="border-b border-line text-[10px] uppercase tracking-[0.14em] text-mute">{head.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line/60 [&_td]:px-4 [&_td]:py-3 [&_tr:hover]:bg-white/[0.02]">{children}</tbody>
      </table>
      {empty && <p className="py-12 text-center text-sm text-mute">Nothing to show.</p>}
    </div>
  );
}

export function FilterTabs({ tabs, active, base }: { tabs: { id: string; label: string; count?: number }[]; active: string; base: string }) {
  return (
    <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
      {tabs.map((t) => (
        <a key={t.id} href={t.id ? `${base}${base.includes("?") ? "&" : "?"}status=${t.id}` : base}
          className={`chip shrink-0 ${active === t.id ? "border-accent/50 bg-accent/10 text-white" : ""}`}>
          {t.label}{t.count !== undefined && <span className="text-mute">{t.count}</span>}
        </a>
      ))}
    </div>
  );
}
