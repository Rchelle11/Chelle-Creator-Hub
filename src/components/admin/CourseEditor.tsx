"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, FileUp, Loader2, Pencil, Plus, Trash2, Video } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import {
  deleteLesson, deleteModule, deleteResource, saveCourse, saveLesson, saveModule, saveResource,
  type CourseInput, type LessonInput,
} from "@/lib/actions/admin";
import { compressImage, fileExt, uniqueName, uploadFile } from "@/lib/upload";
import type { Lesson, LessonResource, Module } from "@/lib/types";
import { duration } from "@/lib/utils";

type FullLesson = Lesson & { content: { video_path: string | null; video_url: string | null; body: string } | null; resources: LessonResource[] };

export function CourseEditor({ course, modules, lessons }: { course: CourseInput & { id: string }; modules: Module[]; lessons: FullLesson[] }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<FullLesson | null>(null);
  const [newModule, setNewModule] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, after?: () => void) => start(async () => {
    const r = await fn();
    if (r.ok) { if (r.message) toast(r.message); after?.(); router.refresh(); } else toast(r.error ?? "Error", "error");
  });

  const blankLesson = (m: Module): FullLesson => ({
    id: crypto.randomUUID(), module_id: m.id, course_id: course.id, title: "", description: "", thumbnail_url: null, duration_seconds: 0,
    position: lessons.filter((l) => l.module_id === m.id).length + 1, is_preview: false, published: false, content: null, resources: [],
  });

  const move = (m: Module, dir: -1 | 1) => {
    const sorted = [...modules].sort((a, b) => a.position - b.position);
    const i = sorted.findIndex((x) => x.id === m.id); const other = sorted[i + dir]; if (!other) return;
    run(async () => { await saveModule({ id: other.id, course_id: course.id, title: other.title, position: m.position }); return saveModule({ id: m.id, course_id: course.id, title: m.title, position: other.position }); });
  };

  return (
    <div className="space-y-8">
      {/* Course details */}
      <form className="glass grid gap-4 p-5 md:grid-cols-2" action={(f) => run(() => saveCourse({
        id: course.id, slug: String(f.get("slug")), title: String(f.get("title")), subtitle: String(f.get("subtitle")), description: String(f.get("description")),
        thumbnail_url: String(f.get("thumbnail_url") || "") || null, instructor_name: String(f.get("instructor_name")), instructor_bio: String(f.get("instructor_bio")),
        price: Number(f.get("price")), published: f.get("published") === "on",
      }))}>
        <div><label className="label">Title</label><input name="title" defaultValue={course.title} required className="input" /></div>
        <div><label className="label">Slug</label><input name="slug" defaultValue={course.slug} required className="input" /></div>
        <div className="md:col-span-2"><label className="label">Subtitle</label><input name="subtitle" defaultValue={course.subtitle} className="input" /></div>
        <div className="md:col-span-2"><label className="label">Description</label><textarea name="description" defaultValue={course.description} rows={3} className="input" /></div>
        <div><label className="label">Price (₱) — set 0 for a FREE course</label><input name="price" type="number" step="0.01" defaultValue={course.price} className="input" /></div>
        <div><label className="label">Thumbnail URL</label><input name="thumbnail_url" defaultValue={course.thumbnail_url ?? ""} className="input" /></div>
        <div><label className="label">Instructor</label><input name="instructor_name" defaultValue={course.instructor_name} className="input" /></div>
        <div><label className="label">Instructor bio</label><input name="instructor_bio" defaultValue={course.instructor_bio} className="input" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={course.published} className="size-4 accent-[var(--color-accent)]" /> Published</label>
        <button disabled={pending} className="btn-primary md:justify-self-end">Save course</button>
      </form>

      {/* Modules + lessons */}
      <div className="space-y-4">
        {[...modules].sort((a, b) => a.position - b.position).map((m, mi, arr) => (
          <section key={m.id} className="glass overflow-hidden">
            <header className="flex flex-wrap items-center gap-2 border-b border-line p-4">
              <span className="text-[10px] font-bold tracking-[0.2em] text-accent">MODULE {mi + 1}</span>
              <input defaultValue={m.title} onBlur={(e) => e.target.value !== m.title && run(() => saveModule({ id: m.id, course_id: course.id, title: e.target.value, position: m.position }))}
                className="min-w-0 flex-1 bg-transparent font-semibold outline-none focus:underline" />
              <button disabled={mi === 0} onClick={() => move(m, -1)} className="btn-quiet btn-sm px-2" aria-label="Move up"><ArrowUp className="size-4" /></button>
              <button disabled={mi === arr.length - 1} onClick={() => move(m, 1)} className="btn-quiet btn-sm px-2" aria-label="Move down"><ArrowDown className="size-4" /></button>
              <button onClick={() => confirm("Delete module and all its lessons?") && run(() => deleteModule(m.id))} className="btn-quiet btn-sm px-2 text-bad" aria-label="Delete module"><Trash2 className="size-4" /></button>
            </header>
            <ul>
              {lessons.filter((l) => l.module_id === m.id).sort((a, b) => a.position - b.position).map((l) => (
                <li key={l.id} className="flex items-center gap-3 border-b border-line/50 px-4 py-3 text-sm last:border-0">
                  <span className="w-6 text-mute">{l.position}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{l.title}</span>
                  {l.is_preview && <Badge tone="gold">Preview</Badge>}
                  {!l.content?.video_path && !l.content?.video_url && <Badge tone="warn">No video</Badge>}
                  <span className="hidden text-xs text-mute sm:inline">{duration(l.duration_seconds)}</span>
                  {l.published ? <Eye className="size-4 text-ok" /> : <EyeOff className="size-4 text-mute" />}
                  <button onClick={() => setEditing(l)} className="btn-quiet btn-sm px-2" aria-label="Edit lesson"><Pencil className="size-4" /></button>
                </li>
              ))}
            </ul>
            <button onClick={() => setEditing(blankLesson(m))} className="flex w-full items-center gap-2 px-4 py-3 text-sm text-accent hover:bg-white/[0.03]"><Plus className="size-4" /> Add lesson</button>
          </section>
        ))}
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!newModule.trim()) return; run(() => saveModule({ course_id: course.id, title: newModule.trim(), position: modules.length + 1 }), () => setNewModule("")); }}>
          <input value={newModule} onChange={(e) => setNewModule(e.target.value)} className="input" placeholder="New module title" />
          <button className="btn-ghost h-12"><Plus className="size-4" /> Module</button>
        </form>
      </div>

      {editing && <LessonModal lesson={editing} modules={modules} courseId={course.id} onClose={() => setEditing(null)} run={run} pending={pending} />}
    </div>
  );
}

function LessonModal({ lesson, modules, courseId, onClose, run, pending }: {
  lesson: FullLesson; modules: Module[]; courseId: string; onClose: () => void; pending: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, after?: () => void) => void;
}) {
  const toast = useToast();
  const [videoPath, setVideoPath] = useState(lesson.content?.video_path ?? null);
  const [thumb, setThumb] = useState(lesson.thumbnail_url);
  const [progress, setProgress] = useState<number | null>(null);
  const [dur, setDur] = useState(lesson.duration_seconds);
  const [res, setRes] = useState({ kind: "pdf" as LessonResource["kind"], title: "", url: "", content: "" });
  const [resFile, setResFile] = useState<File | null>(null);
  const [uploadingRes, setUploadingRes] = useState(false);

  async function uploadVideo(f?: File) {
    if (!f) return;
    try {
      const v = document.createElement("video"); v.preload = "metadata"; v.src = URL.createObjectURL(f);
      v.onloadedmetadata = () => setDur(Math.round(v.duration));
      // Private bucket, path scoped by course id → storage policy checks enrollment.
      const { path } = await uploadFile("course-media", `${courseId}/${lesson.id}/${uniqueName(fileExt(f, "mp4"))}`, f, setProgress);
      setVideoPath(path); toast("Video uploaded successfully.");
    } catch (e) { toast(e instanceof Error ? e.message : "Upload failed", "error"); }
    setProgress(null);
  }
  async function uploadThumb(f?: File) {
    if (!f) return;
    try { setThumb((await uploadFile("public-assets", `lessons/${lesson.id}/${uniqueName("jpg")}`, await compressImage(f, 1280))).publicUrl); }
    catch (e) { toast(e instanceof Error ? e.message : "Upload failed", "error"); }
  }
  async function addResource() {
    if (!res.title) return toast("Resource needs a title.", "error");
    setUploadingRes(true);
    let file_path: string | null = null;
    try { if (resFile) file_path = (await uploadFile("course-media", `${courseId}/${lesson.id}/res-${uniqueName(fileExt(resFile))}`, resFile)).path; }
    catch (e) { setUploadingRes(false); return toast(e instanceof Error ? e.message : "Upload failed", "error"); }
    setUploadingRes(false);
    run(() => saveResource({ lesson_id: lesson.id, kind: res.kind, title: res.title, file_path, url: res.url || null, content: res.content || null, position: lesson.resources.length + 1 }),
      () => { setRes({ kind: "pdf", title: "", url: "", content: "" }); setResFile(null); });
  }

  const isNew = !lesson.title;
  return (
    <Modal open onClose={onClose} title={isNew ? "New lesson" : "Edit lesson"} className="md:max-w-2xl">
      <form className="space-y-4" action={(f) => run(() => saveLesson({
        id: lesson.id, course_id: courseId, module_id: String(f.get("module_id")), title: String(f.get("title")), description: String(f.get("description")),
        thumbnail_url: thumb, duration_seconds: dur, position: Number(f.get("position")), is_preview: f.get("is_preview") === "on",
        published: f.get("published") === "on", video_path: videoPath, video_url: String(f.get("video_url") || "") || null, body: String(f.get("body")),
      } satisfies LessonInput), onClose)}>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <div><label className="label">Title</label><input name="title" defaultValue={lesson.title} required className="input" /></div>
          <div><label className="label">Order</label><input name="position" type="number" min={1} defaultValue={lesson.position} className="input" /></div>
        </div>
        <div><label className="label">Module</label><select name="module_id" defaultValue={lesson.module_id} className="input">{modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
        <div><label className="label">Short description</label><textarea name="description" defaultValue={lesson.description} rows={2} className="input" /></div>
        <div className="rounded-xl border border-line p-4">
          <p className="label">Video</p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="btn-ghost btn-sm cursor-pointer"><Video className="size-4" /> {videoPath ? "Replace upload" : "Upload video"}
              <input type="file" accept="video/*" className="hidden" onChange={(e) => uploadVideo(e.target.files?.[0])} /></label>
            {videoPath && <span className="truncate text-xs text-ok">✓ Stored privately · {duration(dur)}</span>}
          </div>
          {progress !== null && <ProgressBar value={progress} size="sm" className="mt-3" />}
          <p className="my-3 text-center text-[11px] text-mute">— or external stream URL (Mux, Bunny, Vimeo) —</p>
          <input name="video_url" defaultValue={lesson.content?.video_url ?? ""} className="input" placeholder="https://…" />
          <div className="mt-3"><label className="label">Duration (seconds)</label><input type="number" value={dur} onChange={(e) => setDur(Number(e.target.value))} className="input" /></div>
        </div>
        <div className="flex items-center gap-3">
          <label className="btn-ghost btn-sm cursor-pointer"><FileUp className="size-4" /> Thumbnail<input type="file" accept="image/*" className="hidden" onChange={(e) => uploadThumb(e.target.files?.[0])} /></label>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {thumb && <img src={thumb} alt="" className="h-12 rounded-lg" />}
        </div>
        <div><label className="label">Lesson content</label><textarea name="body" defaultValue={lesson.content?.body ?? ""} rows={5} className="input" /></div>
        <div className="flex gap-5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={lesson.published || isNew} className="size-4 accent-[var(--color-accent)]" /> Published</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_preview" defaultChecked={lesson.is_preview} className="size-4 accent-[var(--color-accent)]" /> Free preview</label>
        </div>
        <div className="flex gap-2">
          <button disabled={pending || progress !== null} className="btn-primary flex-1">{pending && <Loader2 className="size-4 animate-spin" />} Save lesson</button>
          {!isNew && <button type="button" onClick={() => confirm("Delete lesson?") && run(() => deleteLesson(lesson.id), onClose)} className="btn-danger"><Trash2 className="size-4" /></button>}
        </div>
      </form>

      {!isNew && (
        <div className="mt-6 border-t border-line pt-5">
          <p className="label">Resources</p>
          <ul className="mb-3 space-y-1.5">
            {lesson.resources.map((r) => (
              <li key={r.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <Badge>{r.kind}</Badge><span className="flex-1 truncate">{r.title}</span>
                <button onClick={() => run(() => deleteResource(r.id))} className="text-mute hover:text-bad" aria-label="Remove"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
          <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
            <select value={res.kind} onChange={(e) => setRes({ ...res, kind: e.target.value as LessonResource["kind"] })} className="input">
              <option value="pdf">PDF</option><option value="template">Template</option><option value="prompt">AI Prompt</option><option value="link">Link</option>
            </select>
            <input value={res.title} onChange={(e) => setRes({ ...res, title: e.target.value })} className="input" placeholder="Resource title" />
          </div>
          {res.kind === "prompt"
            ? <textarea value={res.content} onChange={(e) => setRes({ ...res, content: e.target.value })} rows={3} className="input mt-2" placeholder="Prompt text students will copy" />
            : res.kind === "link"
              ? <input value={res.url} onChange={(e) => setRes({ ...res, url: e.target.value })} className="input mt-2" placeholder="https://…" />
              : <input type="file" onChange={(e) => setResFile(e.target.files?.[0] ?? null)} className="mt-2 text-sm text-mute file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white" />}
          <button type="button" disabled={uploadingRes} onClick={addResource} className="btn-ghost btn-sm mt-3">{uploadingRes && <Loader2 className="size-4 animate-spin" />}<Plus className="size-4" /> Add resource</button>
        </div>
      )}
    </Modal>
  );
}
