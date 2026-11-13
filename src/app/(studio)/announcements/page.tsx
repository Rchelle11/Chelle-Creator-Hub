import { ExternalLink, Megaphone } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Announcement } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("announcements").select("*").lte("publish_at", new Date().toISOString()).order("publish_at", { ascending: false });
  const items = (data ?? []) as Announcement[];
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="From Rochelle" title="Announcements" />
      {!items.length ? <EmptyState icon={Megaphone} title="No announcements yet." /> : (
        <div className="space-y-4">
          {items.map((a) => (
            <article key={a.id} className="glass overflow-hidden">
              {a.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.image_url} alt="" className="aspect-[2/1] w-full object-cover" />
              )}
              <div className="p-5 md:p-6">
                <p className="text-xs text-mute">{fmtDate(a.publish_at)}</p>
                <h2 className="mt-1 text-xl font-semibold">{a.title}</h2>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed text-soft">{a.content}</p>
                {a.link_url && <a href={a.link_url} target={a.link_url.startsWith("/") ? undefined : "_blank"} rel="noreferrer" className="btn-ghost btn-sm mt-4">Open <ExternalLink className="size-3.5" /></a>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
