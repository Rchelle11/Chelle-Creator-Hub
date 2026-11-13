import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { MessageComposer } from "@/components/MessageComposer";
import { broadcast } from "@/lib/actions/admin";
import { cn, timeAgo } from "@/lib/utils";

export const metadata = { title: "Messages" };

export default async function AdminMessages() {
  const { supabase, user } = await requireAdmin();
  const { data } = await supabase.from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url), recipient:profiles!messages_recipient_id_fkey(id, full_name, avatar_url)")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(300);
  // Group into one thread per student.
  const threads = new Map<string, { other: { id: string; full_name: string; avatar_url: string | null }; last: { content: string; created_at: string; mine: boolean }; unread: number }>();
  for (const m of data ?? []) {
    const mine = m.sender_id === user.id;
    const other = mine ? m.recipient : m.sender;
    if (!other) continue;
    const t = threads.get(other.id) ?? { other, last: { content: m.content, created_at: m.created_at, mine }, unread: 0 };
    if (!mine && !m.read) t.unread++;
    threads.set(other.id, t);
  }
  if ((data ?? []).some((m) => m.recipient_id === user.id && !m.read))
    await supabase.from("messages").update({ read: true }).eq("recipient_id", user.id).eq("read", false);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Messages" subtitle="Message individual students from their profile, or broadcast to everyone." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="glass divide-y divide-line overflow-hidden">
          {[...threads.values()].map((t) => (
            <Link key={t.other.id} href={`/admin/students/${t.other.id}`} className={cn("flex items-center gap-3 p-4 hover:bg-white/[0.03]", t.unread && "bg-accent/[0.05]")}>
              <Avatar name={t.other.full_name} src={t.other.avatar_url} size={40} />
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{t.other.full_name}</p><p className="truncate text-sm text-mute">{t.last.mine ? "You: " : ""}{t.last.content}</p></div>
              <span className="text-right text-xs text-mute">{timeAgo(t.last.created_at)}{t.unread > 0 && <span className="mt-1 block rounded-full bg-accent px-1.5 text-center text-[10px] font-bold text-white">{t.unread}</span>}</span>
            </Link>
          ))}
          {!threads.size && <p className="p-10 text-center text-sm text-mute">No conversations yet.</p>}
        </div>
        <section className="glass h-fit p-5">
          <h2 className="label mb-1">Group message</h2>
          <p className="mb-3 text-xs text-mute">Sends a direct message to every active student.</p>
          <MessageComposer send={broadcast} placeholder="Message all students…" />
        </section>
      </div>
    </>
  );
}
