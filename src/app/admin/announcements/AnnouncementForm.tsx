"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { createAnnouncement } from "@/lib/actions/admin";
import { compressImage, uniqueName, uploadFile } from "@/lib/upload";

export function AnnouncementForm() {
  const toast = useToast();
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [image, setImage] = useState<File | null>(null);
  return (
    <form ref={form} className="glass space-y-4 p-5" action={(f) => start(async () => {
      let image_url: string | null = null;
      try { if (image) image_url = (await uploadFile("public-assets", `announcements/${uniqueName("jpg")}`, await compressImage(image, 1600))).publicUrl; }
      catch (e) { return toast(e instanceof Error ? e.message : "Image upload failed", "error"); }
      const at = String(f.get("publish_at") || "");
      const r = await createAnnouncement({ title: String(f.get("title")), content: String(f.get("content")), link_url: String(f.get("link_url") || "") || null, image_url, publish_at: at ? new Date(at).toISOString() : null });
      if (!r.ok) return toast(r.error, "error");
      toast(r.message ?? "Published."); form.current?.reset(); setImage(null); router.refresh();
    })}>
      <h2 className="flex items-center gap-2 font-semibold"><Megaphone className="size-4 text-accent" /> New announcement</h2>
      <div><label className="label">Title</label><input name="title" required className="input" placeholder="NEW MASTERCLASS UPDATE" /></div>
      <div><label className="label">Message</label><textarea name="content" required rows={4} className="input" placeholder="New lesson added: How to Create Viral Hooks" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Link (optional)</label><input name="link_url" className="input" placeholder="/courses/short-video-masterclass" /></div>
        <div><label className="label">Publish date</label><input name="publish_at" type="datetime-local" className="input" /></div>
      </div>
      <div><label className="label">Image (optional)</label><input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} className="text-sm text-mute file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white" /></div>
      <button disabled={pending} className="btn-primary w-full">{pending && <Loader2 className="size-4 animate-spin" />} Publish & notify students</button>
    </form>
  );
}
