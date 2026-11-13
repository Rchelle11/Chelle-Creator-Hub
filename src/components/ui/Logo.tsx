import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", className, compact }: { href?: string; className?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-accent text-[15px] font-black tracking-tighter text-white shadow-[0_0_24px_-6px_var(--color-accent)]">R</span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[13px] font-extrabold tracking-[0.18em]">ROCHELLE OS</span>
          <span className="mt-1 block text-[9px] font-semibold tracking-[0.26em] text-mute">SHORT VIDEO MASTERCLASS</span>
        </span>
      )}
    </Link>
  );
}
