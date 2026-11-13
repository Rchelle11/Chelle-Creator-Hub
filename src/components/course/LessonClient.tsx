"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, ExternalLink, FileText, LayoutTemplate, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { completeLesson, saveNotes } from "@/lib/actions/learning";
import type { LessonResource } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LessonResources({ resources }: { resources: (LessonResource & { href: string | null })[] }) {
  const toast = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  if (!resources.length) return <p className="text-sm text-mute">No resources for this lesson.</p>;
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {resources.map((r) => {
        const Icon = r.kind === "pdf" ? FileText : r.kind === "template" ? LayoutTemplate : r.kind === "prompt" ? Sparkles : ExternalLink;
        const label = r.kind === "pdf" ? "Download PDF" : r.kind === "template" ? "Download Template" : r.kind === "prompt" ? "Copy AI Prompt" : "Open Resource";
        const cls = "glass glass-hover flex items-center gap-3 p-4 text-left";
        const body = (
          <>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><Icon className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block truncate text-xs text-mute">{r.title}</span>
            </span>
            {r.kind === "prompt" ? (copied === r.id ? <Check className="size-4 text-ok" /> : <Copy className="size-4 text-mute" />) : <Download className="size-4 text-mute" />}
          </>
        );
        if (r.kind === "prompt")
          return (
            <button key={r.id} className={cls} onClick={async () => {
              await navigator.clipboard.writeText(r.content ?? "");
              setCopied(r.id); toast("AI prompt copied to clipboard."); setTimeout(() => setCopied(null), 2000);
            }}>{body}</button>
          );
        return <a key={r.id} href={r.href ?? "#"} target="_blank" rel="noreferrer" className={cls}>{body}</a>;
      })}
    </div>
  );
}

export function LessonNotes({ lessonId, initial }: { lessonId: string; initial: string }) {
  const toast = useToast();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <div>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={6} className="input"
        placeholder="Write down ideas, hooks, timestamps… only you can see these." />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-mute">{value === saved ? (saved ? "Saved" : "Private to you") : "Unsaved changes"}</span>
        <button disabled={pending || value === saved} className="btn-ghost btn-sm"
          onClick={() => start(async () => {
            const r = await saveNotes(lessonId, value);
            if (r.ok) { setSaved(value); toast("Notes saved."); } else toast(r.error, "error");
          })}>
          {pending && <Loader2 className="size-4 animate-spin" />} Save Notes
        </button>
      </div>
    </div>
  );
}

export function CompleteButton({ lessonId, slug, completed, nextId }: { lessonId: string; slug: string; completed: boolean; nextId: string | null }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(completed);

  if (done)
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <span className="btn h-12 flex-1 border border-ok/25 bg-ok/10 text-ok"><CheckCircle2 className="size-5" /> Lesson completed</span>
        {nextId && <button onClick={() => router.push(`/courses/${slug}/${nextId}`)} className="btn-primary h-12 flex-1">Next lesson →</button>}
      </div>
    );

  return (
    <button disabled={pending} className={cn("btn-primary h-13 w-full text-[15px]")}
      onClick={() => start(async () => {
        const r = await completeLesson(lessonId);
        if (!r.ok) return toast(r.error, "error");
        setDone(true);
        if (r.data!.course_completed) { router.push(`/courses/${slug}/complete`); return; }
        toast(`Lesson marked as complete. ${r.data!.percent}% done.`);
        if (r.data!.next_lesson_id) setTimeout(() => router.push(`/courses/${slug}/${r.data!.next_lesson_id}`), 700);
        else router.refresh();
      })}>
      {pending ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />} Mark Lesson Complete
    </button>
  );
}
