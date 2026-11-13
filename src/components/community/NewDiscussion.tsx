"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PenSquare } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createDiscussion } from "@/lib/actions/community";
import { COMMUNITY_CATEGORIES } from "@/lib/types";

export function NewDiscussion({ defaultCategory = "general" }: { defaultCategory?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary"><PenSquare className="size-4" /> New post</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Start a discussion">
        <form className="space-y-4" action={(f) => start(async () => {
          const r = await createDiscussion({ category: String(f.get("category")), title: String(f.get("title")), body: String(f.get("body")) });
          if (!r.ok) return toast(r.error, "error");
          toast("Your post is now live."); setOpen(false); router.push(`/community/${r.data}`);
        })}>
          <div><label className="label">Category</label>
            <select name="category" defaultValue={defaultCategory} className="input">{COMMUNITY_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
          <div><label className="label">Title</label><input name="title" required maxLength={200} className="input" placeholder="What's on your mind?" /></div>
          <div><label className="label">Details</label><textarea name="body" rows={5} className="input" placeholder="Share context, links, what you've tried…" /></div>
          <button disabled={pending} className="btn-primary w-full">{pending && <Loader2 className="size-4 animate-spin" />} Post</button>
        </form>
      </Modal>
    </>
  );
}
