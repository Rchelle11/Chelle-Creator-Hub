import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", className, compact }: { href?: string; className?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-[15px] font-black tracking-tighter text-pure shadow-[0_0_24px_-6px_var(--color-accent)]">C</span>
      {!compact && (
        <span className="leading-none">
          <span className="block whitespace-nowrap text-[11px] font-extrabold tracking-[0.1em] sm:text-[13px] sm:tracking-[0.12em]">CHELLE CREATOR HUB</span>
          <span className="mt-1 block text-[8px] sm:text-[9px] font-semibold whitespace-nowrap tracking-[0.2em] text-mute">SHORT VIDEO MASTERCLASS</span>
        </span>
      )}
    </Link>
  );
}
