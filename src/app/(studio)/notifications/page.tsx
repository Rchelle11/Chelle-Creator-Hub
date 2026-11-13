import Link from "next/link";
import { Bell } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Notification } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  const items = (data ?? []) as Notification[];
  // Viewing the full list marks everything read.
  if (items.some((n) => !n.read)) await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Notifications" />
      {!items.length ? <EmptyState icon={Bell} title="You're all caught up." /> : (
        <div className="glass divide-y divide-line overflow-hidden">
          {items.map((n) => (
            <Link key={n.id} href={n.link ?? "#"} className={cn("flex gap-3 p-4 transition hover:bg-white/[0.03]", !n.read && "bg-accent/[0.05]")}>
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-white/10" : "bg-accent")} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{n.title}</span>
                {n.message && <span className="mt-0.5 block text-sm text-mute">{n.message}</span>}
              </span>
              <span className="shrink-0 text-xs text-mute">{timeAgo(n.created_at)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
