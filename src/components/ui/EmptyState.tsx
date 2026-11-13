import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, body, cta, href }: {
  icon: LucideIcon; title: string; body?: string; cta?: string; href?: string;
}) {
  return (
    <div className="glass flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-5 grid size-16 place-items-center rounded-2xl border border-line bg-gradient-to-b from-white/[0.08] to-transparent">
        <Icon className="size-7 text-accent" strokeWidth={1.6} />
      </div>
      <h3 className="h-display text-2xl">{title}</h3>
      {body && <p className="mt-2 max-w-xs text-sm text-mute">{body}</p>}
      {cta && href && <Link href={href} className="btn-primary mt-6">{cta}</Link>}
    </div>
  );
}
