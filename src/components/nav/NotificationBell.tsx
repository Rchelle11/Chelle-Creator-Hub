"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export function NotificationBell({ userId, align = "right" }: { userId: string; align?: "left" | "right" }) {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    supabase.from("notifications").select("*").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setItems((data ?? []) as Notification[]));
    const channel = supabase.channel(`notif-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (p) => setItems((x) => [p.new as Notification, ...x].slice(0, 20)))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId]);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function markAll() {
    setItems((x) => x.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  }
  async function openItem(n: Notification) {
    setOpen(false);
    if (!n.read) {
      setItems((x) => x.map((y) => (y.id === n.id ? { ...y, read: true } : y)));
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    }
    if (n.link) router.push(n.link);
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label={`Notifications (${unread} unread)`}
        className="relative grid size-10 place-items-center rounded-xl text-soft transition hover:bg-white/[0.06] hover:text-white">
        <Bell className="size-5" strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid min-w-[18px] animate-pop place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-[18px] text-pure ring-2 ring-ink">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className={cn("glass fixed inset-x-3 top-16 z-[80] animate-fade-up overflow-hidden bg-ink-2/95 shadow-2xl md:absolute md:inset-x-auto md:top-12 md:w-96",
          align === "right" ? "md:right-0" : "md:left-0")}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && <button onClick={markAll} className="flex items-center gap-1 text-xs text-mute hover:text-white"><CheckCheck className="size-3.5" /> Mark all read</button>}
          </div>
          <div className="max-h-[60dvh] overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-10 text-center text-sm text-mute">You&apos;re all caught up.</p>}
            {items.map((n) => (
              <button key={n.id} onClick={() => openItem(n)}
                className={cn("flex w-full gap-3 border-b border-line/50 px-4 py-3 text-left transition hover:bg-white/[0.04]", !n.read && "bg-accent/[0.05]")}>
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-accent")} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{n.title}</span>
                  {n.message && <span className="mt-0.5 line-clamp-2 block text-xs text-mute">{n.message}</span>}
                  <span className="mt-1 block text-[11px] text-mute/70">{timeAgo(n.created_at)}</span>
                </span>
              </button>
            ))}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-line py-3 text-center text-xs font-semibold text-accent">View all</Link>
        </div>
      )}
    </div>
  );
}
