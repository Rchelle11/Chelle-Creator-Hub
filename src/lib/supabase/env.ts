export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Fixed auth cookie name so server and browser agree even if they reach Supabase via different URLs. */
export const COOKIE_OPTIONS = { name: "sb-rochelle-auth-token" };

const isLocal = (u: string) => /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(u);

/**
 * URL the *browser* should use. When Supabase runs locally but the app is opened from
 * another device (e.g. a preview URL), route through the app's own `/supabase` rewrite.
 */
export function browserSupabaseUrl() {
  if (typeof window === "undefined" || !isLocal(SUPABASE_URL)) return SUPABASE_URL;
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) return SUPABASE_URL;
  return `${window.location.origin}/supabase`;
}
