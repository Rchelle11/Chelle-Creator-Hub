"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/components/nav/items";
import { cn } from "@/lib/utils";

export function AdminMobileNav() {
  const path = usePathname();
  return (
    <nav className="no-scrollbar sticky top-14 z-30 -mx-4 mb-5 flex gap-1.5 overflow-x-auto border-b border-line bg-ink/85 px-4 py-2.5 backdrop-blur-xl md:hidden">
      {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={cn("chip shrink-0 py-1.5", active && "border-accent/50 bg-accent/10 text-white")}><Icon className="size-3.5" />{label}</Link>
        );
      })}
    </nav>
  );
}
