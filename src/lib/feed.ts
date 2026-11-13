// Shared by server pages and client feed — must NOT live in a "use client" module.
export const FEED_SELECT = "*, author:profiles!posts_user_id_fkey(id, full_name, avatar_url), challenge:challenges!posts_challenge_id_fkey(id, title)";
export const PAGE = 6;
