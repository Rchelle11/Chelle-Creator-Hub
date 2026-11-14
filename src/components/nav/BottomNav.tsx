"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { STUDENT_NAV } from "./items";

export function BottomNav({ freeTag }: { freeTag?: boolean }) {
  const path = usePathname();
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-line bg-ink/85 backdrop-blur-2xl md:hidden">
      <div className="grid h-16 grid-cols-5">
        {STUDENT_NAV.filter((i) => i.mobile).map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={cn("flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition active:scale-90",
              active ? "text-white" : "text-mute")}>
              <span className={cn("relative grid h-7 w-12 place-items-center rounded-full transition", active && "bg-accent/15")}>
                {freeTag && href === "/courses" && <span className="absolute -right-2 -top-1.5 rounded bg-ok px-1 text-[8px] font-black leading-[13px] tracking-wide text-black/85">FREE</span>}
                <Icon className={cn("size-[21px]", active && "text-accent")} strokeWidth={active ? 2.2 : 1.8} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
