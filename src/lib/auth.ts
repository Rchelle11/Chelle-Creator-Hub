import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  return { supabase, user, profile };
});

export async function requireUser() {
  const s = await getSession();
  if (!s.user || !s.profile) redirect("/login");
  if (s.profile.status === "suspended") redirect("/suspended");
  return { supabase: s.supabase, user: s.user, profile: s.profile };
}

export async function requireAdmin() {
  const s = await requireUser();
  if (s.profile.role !== "admin") redirect("/dashboard");
  return s;
}
