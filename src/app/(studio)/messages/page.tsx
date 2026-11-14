import { Mail } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageComposer } from "@/components/MessageComposer";
import { markMessagesRead, sendMessageToAdmin } from "@/lib/actions/account";
import { cn, timeAgo } from "@/lib/utils";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("messages").select("*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at", { ascending: true }).limit(200);
  await markMessagesRead();
  const msgs = data ?? [];
  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <PageHeader eyebrow="Inbox" title="Messages" subtitle="Direct line to your instructor." />
      {!msgs.length ? <EmptyState icon={Mail} title="No messages yet." body="Messages from Rochelle will appear here." /> : (
        <div className="glass mb-4 space-y-4 p-4 md:p-6">
          {msgs.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} className={cn("flex gap-2.5", mine && "flex-row-reverse")}>
                {!mine && <Avatar name={m.sender?.full_name ?? "?"} src={m.sender?.avatar_url} size={32} />}
                <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm", mine ? "rounded-br-md bg-accent text-pure" : "rounded-bl-md bg-white/[0.06]")}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={cn("mt-1 text-[10px]", mine ? "text-white/70" : "text-mute")}>{timeAgo(m.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <MessageComposer send={sendMessageToAdmin} placeholder="Reply to Rochelle…" />
    </div>
  );
}
