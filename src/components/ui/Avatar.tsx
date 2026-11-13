import { cn, initials } from "@/lib/utils";

export function Avatar({ name, src, size = 40, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent/80 to-gold/70 font-semibold text-white ring-1 ring-white/10", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="size-full object-cover" loading="lazy" />
      ) : initials(name)}
    </span>
  );
}
