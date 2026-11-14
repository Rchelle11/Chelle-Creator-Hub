import Link from "next/link";
import { Search, Shield } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function TopBar({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 pt-[env(safe-area-inset-top)] backdrop-blur-2xl">
      <div className="flex h-14 items-center gap-2 px-4 md:h-16 md:px-8">
        <div className="md:hidden"><Logo href="/dashboard" compact /></div>
        <Link href="/search" className="ml-auto flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-mute transition hover:bg-white/[0.06] hover:text-white md:ml-0 md:w-80 md:border md:border-line md:bg-white/[0.03]">
          <Search className="size-[18px]" /> <span className="hidden md:inline">Search lessons, creators, posts…</span>
        </Link>
        {isAdmin && <Link href="/admin" className="grid size-10 place-items-center rounded-xl text-accent hover:bg-white/[0.06] md:hidden" aria-label="Admin"><Shield className="size-5" /></Link>}
        <div className="flex items-center md:ml-auto"><ThemeToggle /><NotificationBell userId={userId} /></div>
      </div>
    </header>
  );
}
