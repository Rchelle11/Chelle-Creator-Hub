import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Sidebar } from "@/components/nav/Sidebar";
import { NotificationBell } from "@/components/nav/NotificationBell";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const metadata = { title: { default: "Admin", template: "%s · Admin · ROCHELLE OS" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireAdmin();
  const { count } = await supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending");
  return (
    <div className="grain flex min-h-dvh">
      <Sidebar variant="admin" name={profile.full_name} avatar={profile.avatar_url} isAdmin badges={{ "/admin/payments": count ?? 0 }} />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 pt-[env(safe-area-inset-top)] backdrop-blur-2xl">
          <div className="flex h-14 items-center gap-3 px-4 md:h-16 md:px-8">
            <div className="md:hidden"><Logo href="/admin" compact /></div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-accent md:hidden">ADMIN</span>
            <Link href="/dashboard" className="btn-quiet btn-sm ml-auto md:hidden">Student view</Link>
            <div className="flex items-center md:ml-auto"><ThemeToggle /><NotificationBell userId={user.id} /></div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-0 md:px-8 md:pt-8">
          <AdminMobileNav />
          {children}
        </main>
      </div>
    </div>
  );
}
