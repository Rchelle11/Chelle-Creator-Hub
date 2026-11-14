"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { fail } from "./_run";

/** Every admin action re-checks the role server-side; RLS enforces it again in Postgres. */
async function admin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (data?.role !== "admin") throw new Error("Admins only");
  return { supabase, user };
}
async function guard<T>(fn: () => Promise<ActionResult<T>>, ...paths: string[]): Promise<ActionResult<T>> {
  try {
    const r = await fn();
    if (r.ok) paths.forEach((p) => revalidatePath(p, "layout"));
    return r;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong. Please try again." };
  }
}
const done = (message?: string): ActionResult => ({ ok: true, message });

// ---------- payments ----------
export const approvePayment = async (id: string) => guard(async () => {
  const { supabase } = await admin();
  const { error } = await supabase.rpc("approve_payment", { p_payment_id: id });
  return error ? fail(error) : done("Payment approved — student enrolled.");
}, "/admin");

export const rejectPayment = async (id: string, reason: string) => guard(async () => {
  const { supabase } = await admin();
  const { error } = await supabase.rpc("reject_payment", { p_payment_id: id, p_reason: reason });
  return error ? fail(error) : done("Payment rejected. Student notified.");
}, "/admin");

// ---------- students ----------
export const setStudentStatus = async (id: string, status: "active" | "suspended") => guard(async () => {
  const { supabase } = await admin();
  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
  return error ? fail(error) : done(status === "suspended" ? "Account suspended." : "Account reactivated.");
}, "/admin/students");

export const sendMessage = async (recipientId: string, content: string) => guard(async () => {
  const { supabase, user } = await admin();
  const { error } = await supabase.from("messages").insert({ sender_id: user.id, recipient_id: recipientId, content: content.trim() });
  return error ? fail(error) : done("Message sent.");
}, "/admin/messages");

export const broadcast = async (content: string) => guard(async () => {
  const { supabase } = await admin();
  const { data, error } = await supabase.rpc("admin_broadcast", { p_content: content.trim() });
  return error ? fail(error) : done(`Sent to ${data} students.`);
}, "/admin/messages");

// ---------- courses ----------
export type CourseInput = { id?: string; slug: string; title: string; subtitle: string; description: string; thumbnail_url: string | null; instructor_name: string; instructor_bio: string; price: number; published: boolean };
export const saveCourse = async (c: CourseInput) => guard<string>(async () => {
  const { supabase } = await admin();
  const { data, error } = await supabase.from("courses").upsert({ ...c, slug: c.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-") }).select("id").single();
  return error ? fail(error) : { ok: true as const, data: data.id as string, message: "Course saved." };
}, "/admin/courses", "/courses");

export const saveModule = async (m: { id?: string; course_id: string; title: string; description?: string; position: number }) => guard(async () => {
  const { supabase } = await admin();
  const { error } = await supabase.from("modules").upsert(m);
  return error ? fail(error) : done("Module saved.");
}, "/admin/courses", "/courses");

export const deleteModule = async (id: string) => guard(async () => {
  const { supabase } = await admin();
  const { error } = await supabase.from("modules").delete().eq("id", id);
  return error ? fail(error) : done("Module deleted.");
}, "/admin/courses", "/courses");

export type LessonInput = {
  id: string; module_id: string; course_id: string; title: string; description: string; thumbnail_url: string | null;
  duration_seconds: number; position: number; is_preview: boolean; published: boolean;
  video_path: string | null; video_url: string | null; body: string;
};
export const saveLesson = async (l: LessonInput) => guard(async () => {
  const { supabase } = await admin();
  const { video_path, video_url, body, ...meta } = l;
  const { error } = await supabase.from("lessons").upsert(meta);
  if (error) return fail(error);
  const { error: e2 } = await supabase.from("lesson_content").upsert({ lesson_id: l.id, video_path, video_url, body, updated_at: new Date().toISOString() });
  return e2 ? fail(e2) : done("Lesson saved.");
}, "/admin/courses", "/courses");

export const deleteLesson = async (id: string) => guard(async () => {
  const { supabase } = await admin();
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  return error ? fail(error) : done("Lesson deleted.");
}, "/admin/courses", "/courses");

export const saveResource = async (r: { lesson_id: string; kind: "pdf" | "template" | "prompt" | "link"; title: string; file_path?: string | null; url?: string | null; content?: string | null; position: number }) => guard(async () => {
  const { supabase } = await admin();
  const { error } = await supabase.from("lesson_resources").insert(r);
  return error ? fail(error) : done("Resource added.");
}, "/admin/courses");

export const deleteResource = async (id: string) => guard(async () => {
  const { supabase } = await admin();
  const { error } = await supabase.from("lesson_resources").delete().eq("id", id);
  return error ? fail(error) : done("Resource removed.");
}, "/admin/courses");

// ---------- bottle moderation ----------
export const moderatePost = async (id: string, patch: { featured?: boolean; pinned?: boolean; status?: "published" | "hidden" | "pending" }) => guard(async () => {
  const { supabase } = await admin();
  const { error } = await supabase.from("posts").update(patch).eq("id", id);
  return error ? fail(error) : done("Post updated.");
}, "/admin/battles", "/battles");

export const adminDeletePost = async (id: string) => guard(async () => {
  const { supabase } = await admin();
  const { data: post } = await supabase.from("posts").select("video_path").eq("id", id).single();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return fail(error);
  if (post?.video_path) await supabase.storage.from("bottle").remove([post.video_path, post.video_path.replace(/\.[^.]+$/, ".jpg")]);
  return done("Post deleted.");
}, "/admin/battles", "/battles");

export const adminDeleteComment = async (id: string, table: "comments" | "community_comments" = "comments") => guard(async () => {
  const { supabase } = await admin();
  const { error } = await supabase.from(table).delete().eq("id", id);
  return error ? fail(error) : done("Comment deleted.");
}, "/admin/battles");

// ---------- challenges ----------
export type ChallengeInput = { id?: string; title: string; description: string; instructions: string; cover_url: string | null; reference_video_url: string | null; days: number; start_date: string; end_date: string; status: "draft" | "active" | "ended" };
export const saveChallenge = async (c: ChallengeInput) => guard<string>(async () => {
  const { supabase } = await admin();
  const { data, error } = await supabase.from("challenges").upsert(c).select("id").single();
  return error ? fail(error) : { ok: true as const, data: data.id as string, message: "Challenge saved." };
}, "/admin/challenges", "/challenges");

export const setSubmissionStatus = async (id: string, status: "submitted" | "featured" | "winner") => guard(async () => {
  const { supabase } = await admin();
  const { data, error } = await supabase.from("challenge_submissions").update({ status }).eq("id", id).select("post_id").single();
  if (error) return fail(error);
  if (status !== "submitted" && data?.post_id) await supabase.from("posts").update({ featured: true }).eq("id", data.post_id);
  return done(status === "winner" ? "Winner selected ⭐" : "Submission updated.");
}, "/admin/challenges", "/challenges");

// ---------- announcements ----------
export const createAnnouncement = async (a: { title: string; content: string; image_url: string | null; link_url: string | null; publish_at: string | null }) => guard(async () => {
  const { supabase, user } = await admin();
  const { error } = await supabase.from("announcements").insert({ ...a, publish_at: a.publish_at || new Date().toISOString(), created_by: user.id });
  return error ? fail(error) : done("Announcement published. Students notified.");
}, "/admin/announcements", "/announcements");

export const deleteAnnouncement = async (id: string) => guard(async () => {
  const { supabase } = await admin();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  return error ? fail(error) : done("Announcement deleted.");
}, "/admin/announcements", "/announcements");

// ---------- discounts ----------
export const saveDiscount = async (d: { code: string; percent_off: number | null; amount_off: number | null; max_uses: number | null; expires_at: string | null; course_id: string | null }) => guard(async () => {
  const { supabase } = await admin();
  const { error } = await supabase.from("discount_codes").insert({ ...d, code: d.code.trim().toUpperCase() });
  return error ? fail(error) : done("Discount code created.");
}, "/admin/discounts");

export const toggleDiscount = async (id: string, active: boolean) => guard(async () => {
  const { supabase } = await admin();
  const { error } = await supabase.from("discount_codes").update({ active }).eq("id", id);
  return error ? fail(error) : done(active ? "Code activated." : "Code deactivated.");
}, "/admin/discounts");

export const deleteDiscount = async (id: string) => guard(async () => {
  const { supabase } = await admin();
  const { error } = await supabase.from("discount_codes").delete().eq("id", id);
  return error ? fail(error) : done("Code deleted.");
}, "/admin/discounts");
