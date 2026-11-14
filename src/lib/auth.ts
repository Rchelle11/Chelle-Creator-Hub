import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  if (!profile) {
    // Self-heal accounts created before the database was set up.
    await supabase.rpc("ensure_profile");
    // Note: must differ from the first query (limit added); Next.js memoizes identical
    // GET requests within one render and would otherwise return the stale "no profile".
    ({ data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).limit(1).maybeSingle<Profile>());
  }
  return { supabase, user, profile };
});

export async function requireUser() {
  const s = await getSession();
  if (!s.user) redirect("/login");
  // Signed in but no profile (database not set up yet). Don't bounce to /login,
  // because the proxy sends signed-in users back here and the two would loop.
  if (!s.profile) redirect("/setup-needed");
  if (s.profile.status === "suspended") redirect("/suspended");
  return { supabase: s.supabase, user: s.user, profile: s.profile };
}

export async function requireAdmin() {
  const s = await requireUser();
  if (s.profile.role !== "admin") redirect("/dashboard");
  return s;
}
