export type Role = "student" | "admin";
export type PaymentStatus = "pending" | "approved" | "rejected";
export type PaymentMethod = "gcash" | "gotyme" | "paypal";

export interface Profile {
  id: string; full_name: string; username: string | null; avatar_url: string | null; bio: string;
  role: Role; status: "active" | "suspended"; is_private: boolean; notify_email: boolean; notify_push: boolean;
  last_active_at: string; created_at: string;
}
export interface Course {
  id: string; slug: string; title: string; subtitle: string; description: string; thumbnail_url: string | null;
  instructor_name: string; instructor_bio: string; price: number; currency: string; published: boolean; created_at: string;
}
export interface Module { id: string; course_id: string; title: string; description: string; position: number }
export interface Lesson {
  id: string; module_id: string; course_id: string; title: string; description: string; thumbnail_url: string | null;
  duration_seconds: number; position: number; is_preview: boolean; published: boolean;
}
export interface LessonResource {
  id: string; lesson_id: string; kind: "pdf" | "template" | "prompt" | "link"; title: string;
  file_path: string | null; url: string | null; content: string | null; position: number;
}
export interface Enrollment {
  id: string; user_id: string; course_id: string; status: "active" | "suspended" | "completed";
  progress_percent: number; last_lesson_id: string | null; last_viewed_at: string | null; enrolled_at: string; completed_at: string | null;
}
export interface Payment {
  id: string; user_id: string; course_id: string; amount: number; original_amount: number; method: PaymentMethod;
  reference_number: string; sender_name: string; sender_number: string; receipt_path: string; status: PaymentStatus;
  rejection_reason: string | null; submitted_at: string; approved_at: string | null;
}
export interface Post {
  id: string; user_id: string; video_url: string; video_path: string | null; poster_url: string | null; caption: string;
  tags: string[]; challenge_id: string | null; status: "published" | "pending" | "hidden"; featured: boolean; pinned: boolean;
  like_count: number; comment_count: number; created_at: string;
}
export type FeedPost = Post & {
  author: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  challenge: { id: string; title: string } | null;
  liked?: boolean;
};
export interface Comment {
  id: string; post_id: string; user_id: string; parent_id: string | null; content: string; created_at: string;
  author?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
}
export interface Challenge {
  id: string; title: string; description: string; instructions: string; cover_url: string | null;
  reference_video_url: string | null; days: number; start_date: string; end_date: string; status: "draft" | "active" | "ended"; created_at: string;
}
export interface Notification {
  id: string; user_id: string; type: string; title: string; message: string; link: string | null; read: boolean; created_at: string;
}
export interface Announcement {
  id: string; title: string; content: string; image_url: string | null; link_url: string | null; publish_at: string; created_at: string;
}
export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

export const COMMUNITY_CATEGORIES = [
  { id: "general", label: "General" },
  { id: "questions", label: "Questions" },
  { id: "video-editing", label: "Video Editing" },
  { id: "ai-video", label: "AI Video" },
  { id: "capcut", label: "CapCut" },
  { id: "content-ideas", label: "Content Ideas" },
  { id: "freelancing", label: "Freelancing" },
  { id: "wins", label: "Wins & Results" },
] as const;

export const SUGGESTED_TAGS = ["AIvideo", "CapCut", "Reels", "TikTok", "UGC", "VideoEditing"];
