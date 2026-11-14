"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Shield, ArrowLeftRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, STUDENT_NAV } from "./items";

export function Sidebar({ variant, name, avatar, isAdmin, badges = {}, freeTag }: {
  variant: "student" | "admin"; name: string; avatar: string | null; isAdmin: boolean; badges?: Record<string, number>; freeTag?: boolean;
}) {
  const path = usePathname();
  const items = variant === "admin" ? ADMIN_NAV : STUDENT_NAV;
  const isActive = (href: string) => href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/");
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-ink-2/60 px-3 py-5 backdrop-blur-xl md:flex">
      <div className="px-3"><Logo href={variant === "admin" ? "/admin" : "/dashboard"} /></div>
      {variant === "admin" && <p className="mx-3 mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-accent"><Shield className="size-3" />ADMIN</p>}
      <nav className="mt-6 flex flex-1 flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn("group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
              isActive(href) ? "bg-white/[0.07] text-white" : "text-mute hover:bg-white/[0.04] hover:text-white")}>
            {isActive(href) && <span className="absolute -left-3 h-5 w-1 rounded-r-full bg-accent" />}
            <Icon className={cn("size-[18px]", isActive(href) && "text-accent")} strokeWidth={1.8} />
            {label}
            {freeTag && href === "/courses" && <span className="ml-auto rounded-md bg-ok px-1.5 py-0.5 text-[9px] font-black tracking-wider text-black/85">FREE</span>}
            {!!badges[href] && <span className="ml-auto rounded-full bg-accent px-1.5 text-[10px] font-bold text-pure">{badges[href]}</span>}
          </Link>
        ))}
      </nav>
      {isAdmin && (
        <Link href={variant === "admin" ? "/dashboard" : "/admin"} className="mb-2 flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-mute hover:bg-white/[0.04] hover:text-white">
          <ArrowLeftRight className="size-[18px]" /> {variant === "admin" ? "Student view" : "Admin dashboard"}
        </Link>
      )}
      <div className="flex items-center gap-3 rounded-xl border border-line p-2.5">
        <Avatar name={name} src={avatar} size={34} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
        <form action="/auth/signout" method="post">
          <button aria-label="Logout" className="grid size-8 place-items-center rounded-lg text-mute hover:bg-white/[0.06] hover:text-white"><LogOut className="size-4" /></button>
        </form>
      </div>
    </aside>
  );
}
