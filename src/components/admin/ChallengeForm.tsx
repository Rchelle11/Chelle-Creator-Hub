"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { saveChallenge, type ChallengeInput } from "@/lib/actions/admin";
import { compressImage, fileExt, uniqueName, uploadFile } from "@/lib/upload";

const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

export function ChallengeForm({ initial }: { initial?: ChallengeInput & { id: string } }) {
  const toast = useToast(); const router = useRouter();
  const [pending, start] = useTransition();
  const [cover, setCover] = useState(initial?.cover_url ?? null);
  const [ref, setRef] = useState(initial?.reference_video_url ?? "");
  const [progress, setProgress] = useState<number | null>(null);

  async function up(f: File | undefined, kind: "cover" | "ref") {
    if (!f) return;
    try {
      const blob = kind === "cover" ? await compressImage(f, 1600) : f;
      const { publicUrl } = await uploadFile("public-assets", `challenges/${uniqueName(kind === "cover" ? "jpg" : fileExt(f, "mp4"))}`, blob, setProgress);
      if (kind === "cover") setCover(publicUrl); else setRef(publicUrl);
    } catch (e) { toast(e instanceof Error ? e.message : "Upload failed", "error"); }
    setProgress(null);
  }

  return (
    <form className="glass grid gap-4 p-5 md:grid-cols-2" action={(f) => start(async () => {
      const r = await saveChallenge({
        ...(initial?.id ? { id: initial.id } : {}), title: String(f.get("title")), description: String(f.get("description")), instructions: String(f.get("instructions")),
        cover_url: cover, reference_video_url: ref || null, days: Number(f.get("days")), start_date: String(f.get("start_date")), end_date: String(f.get("end_date")),
        status: String(f.get("status")) as ChallengeInput["status"],
      });
      if (!r.ok) return toast(r.error, "error");
      toast(r.message ?? "Saved."); router.push(`/admin/challenges/${r.data}`); router.refresh();
    })}>
      <div className="md:col-span-2"><label className="label">Title</label><input name="title" defaultValue={initial?.title} required className="input" placeholder="7-Day Short Video Challenge" /></div>
      <div className="md:col-span-2"><label className="label">Description</label><input name="description" defaultValue={initial?.description} className="input" placeholder="Create one short video every day for 7 days." /></div>
      <div className="md:col-span-2"><label className="label">Instructions</label><textarea name="instructions" defaultValue={initial?.instructions} rows={5} className="input" /></div>
      <div><label className="label">Start date</label><input name="start_date" type="date" defaultValue={initial?.start_date ?? inDays(0)} className="input" /></div>
      <div><label className="label">End date (deadline)</label><input name="end_date" type="date" defaultValue={initial?.end_date ?? inDays(7)} className="input" /></div>
      <div><label className="label">Days</label><input name="days" type="number" min={1} max={60} defaultValue={initial?.days ?? 7} className="input" /></div>
      <div><label className="label">Status</label><select name="status" defaultValue={initial?.status ?? "active"} className="input"><option value="draft">Draft</option><option value="active">Active</option><option value="ended">Ended</option></select></div>
      <div><label className="label">Cover image</label><input type="file" accept="image/*" onChange={(e) => up(e.target.files?.[0], "cover")} className="text-sm text-mute file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {cover && <img src={cover} alt="" className="mt-2 h-20 rounded-lg" />}</div>
      <div><label className="label">Reference video</label><input type="file" accept="video/*" onChange={(e) => up(e.target.files?.[0], "ref")} className="text-sm text-mute file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white" />
        <input value={ref} onChange={(e) => setRef(e.target.value)} className="input mt-2" placeholder="or paste a video URL" /></div>
      {progress !== null && <ProgressBar value={progress} size="sm" className="md:col-span-2" />}
      <button disabled={pending || progress !== null} className="btn-primary md:col-span-2">{pending && <Loader2 className="size-4 animate-spin" />} Save challenge</button>
    </form>
  );
}
