"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Film, Loader2, Trophy, UploadCloud, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { createPost } from "@/lib/actions/bottle";
import { fileExt, uniqueName, uploadFile, videoPoster } from "@/lib/upload";
import { SUGGESTED_TAGS } from "@/lib/types";
import { cn, parseTags } from "@/lib/utils";

// Matches the `bottle` bucket limit (Supabase free plan: 50 MB per file).
const MAX_MB = 50;

export function PostForm({ userId, challenges, fixedChallenge, days, doneDays = [], explanation }: {
  userId: string;
  challenges: { id: string; title: string }[];
  fixedChallenge?: { id: string; title: string };
  days?: number; doneDays?: number[]; explanation?: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [challengeId, setChallengeId] = useState(fixedChallenge?.id ?? "");
  const firstOpenDay = Array.from({ length: days ?? 1 }, (_, i) => i + 1).find((d) => !doneDays.includes(d)) ?? 1;
  const [day, setDay] = useState(firstOpenDay);
  const [note, setNote] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [stage, setStage] = useState<string | null>(null);

  function pick(f?: File) {
    if (!f) return;
    if (!f.type.startsWith("video/")) return toast("Please choose a video file.", "error");
    if (f.size > MAX_MB * 1024 * 1024) return toast(`Videos must be under ${MAX_MB}MB. Try exporting at 1080p or 720p, 30fps, under 60 seconds.`, "error");
    setFile(f); setPreview(URL.createObjectURL(f));
  }
  const addTag = (t: string) => setTags((x) => parseTags([...x, t].join(" ")));

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast("Add a video first.", "error");
    try {
      const base = uniqueName(fileExt(file, "mp4")).replace(/\.[^.]+$/, "");
      setStage("Preparing…");
      const poster = await videoPoster(file);
      setStage("Uploading video…");
      const video = await uploadFile("bottle", `${userId}/${base}.${fileExt(file, "mp4")}`, file, setProgress);
      let posterUrl: string | null = null;
      if (poster.blob) posterUrl = (await uploadFile("bottle", `${userId}/${base}.jpg`, poster.blob)).publicUrl;
      setStage("Publishing…");
      const r = await createPost({
        videoUrl: video.publicUrl, videoPath: video.path, posterUrl, caption, tags: parseTags([...tags, tagInput].join(" ")),
        challengeId: challengeId || null, day, explanation: note,
      });
      if (!r.ok) throw new Error(r.error);
      toast("Your post is now live.");
      router.push(fixedChallenge ? `/challenges/${fixedChallenge.id}` : `/battles/${r.data}`);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong. Please try again.", "error");
      setStage(null); setProgress(null);
    }
  }

  const busy = stage !== null;

  return (
    <form onSubmit={publish} className="grid gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
      <div>
        <input ref={input} type="file" accept="video/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        {preview ? (
          <div className="relative mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-3xl border border-line bg-black">
            <video src={preview} className="size-full object-cover" controls playsInline muted />
            {!busy && <button type="button" onClick={() => { setFile(null); setPreview(null); }} aria-label="Remove video" className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-black/70"><X className="size-4" /></button>}
          </div>
        ) : (
          <div className="mx-auto flex aspect-[9/16] w-full max-w-[280px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-line-2 p-6 text-center"
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}>
            <span className="grid size-14 place-items-center rounded-2xl bg-accent/15"><UploadCloud className="size-7 text-accent" /></span>
            <p className="font-semibold">Upload Video</p>
            <p className="text-xs text-mute">Vertical 9:16 · MP4 or MOV · up to {MAX_MB}MB</p>
            <button type="button" onClick={() => input.current?.click()} className="btn-primary btn-sm mt-2 w-full"><Film className="size-4" /> Choose from gallery</button>
            <label className="btn-ghost btn-sm w-full cursor-pointer"><Camera className="size-4" /> Record
              <input type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            </label>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {fixedChallenge ? (
          <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm"><Trophy className="size-4 text-accent" /> {fixedChallenge.title}</div>
        ) : challenges.length > 0 && (
          <div>
            <label className="label" htmlFor="challenge">Challenge</label>
            <select id="challenge" value={challengeId} onChange={(e) => setChallengeId(e.target.value)} className="input">
              <option value="">None</option>
              {challenges.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        )}
        {fixedChallenge && (days ?? 1) > 1 && (
          <div>
            <span className="label">Day</span>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: days! }, (_, i) => i + 1).map((d) => (
                <button key={d} type="button" disabled={doneDays.includes(d)} onClick={() => setDay(d)}
                  className={cn("size-11 rounded-xl border text-sm font-semibold transition disabled:opacity-35", day === d ? "border-accent bg-accent/15 text-white" : "border-line text-mute hover:border-line-2")}>{d}</button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="label" htmlFor="caption">Caption</label>
          <textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={2200} rows={3} className="input" placeholder="My first AI product commercial!" />
        </div>
        {explanation && (
          <div>
            <label className="label" htmlFor="note">Explanation (optional)</label>
            <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="input" placeholder="What did you try? What do you want feedback on?" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="tags">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => <button type="button" key={t} onClick={() => setTags((x) => x.filter((y) => y !== t))} className="chip border-accent/30 bg-accent/10 text-white">#{t} <X className="size-3" /></button>)}
          </div>
          <input id="tags" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " " || e.key === ",") && tagInput.trim()) { e.preventDefault(); addTag(tagInput); setTagInput(""); } }}
            className="input mt-2" placeholder="Type a tag and press enter" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => <button type="button" key={t} onClick={() => addTag(t)} className="chip hover:border-line-2 hover:text-white">#{t}</button>)}
          </div>
        </div>
        {busy && (
          <div className="glass p-4">
            <div className="mb-2 flex justify-between text-xs"><span>{stage}</span>{progress !== null && <span>{progress}%</span>}</div>
            <ProgressBar value={progress ?? 5} size="sm" />
          </div>
        )}
        <button disabled={busy || !file} className="btn-primary h-13 w-full text-[15px]">{busy ? <Loader2 className="size-5 animate-spin" /> : null}{fixedChallenge ? "Submit" : "Publish"}</button>
      </div>
    </form>
  );
}
