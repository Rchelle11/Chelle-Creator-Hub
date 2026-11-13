import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Badge } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/admin/ActionButton";
import { deleteAnnouncement } from "@/lib/actions/admin";
import { AnnouncementForm } from "./AnnouncementForm";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Announcements" };

export default async function AdminAnnouncements() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("announcements").select("*").order("publish_at", { ascending: false });
  return (
    <>
      <PageHeader eyebrow="Admin" title="Announcements" />
      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <AnnouncementForm />
        <div className="space-y-3">
          {(data ?? []).map((a) => (
            <div key={a.id} className="glass flex gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-xs text-mute">{fmtDate(a.publish_at, true)} {new Date(a.publish_at) > new Date() && <Badge tone="warn">Scheduled</Badge>}</p>
                <p className="mt-1 font-semibold">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-mute">{a.content}</p>
              </div>
              <ActionButton className="btn-quiet btn-sm text-bad" confirm="Delete this announcement?" action={deleteAnnouncement.bind(null, a.id)}><Trash2 className="size-4" /></ActionButton>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
