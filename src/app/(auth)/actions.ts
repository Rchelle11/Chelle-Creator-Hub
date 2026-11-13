"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string } | undefined;

const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
};

async function origin() {
  const h = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message };
  redirect(safeNext(form.get("next")));
}

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (name.length < 2) return { error: "Please enter your full name." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== form.get("confirm")) return { error: "Passwords don't match." };

  const supabase = await createClient();
  const next = safeNext(form.get("next"));
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: name }, emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { error: error.message };
  if (!data.session) return { message: "Check your inbox to confirm your email, then log in." };
  redirect(next);
}

export async function forgotPassword(_: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(String(form.get("email") ?? "").trim(), {
    redirectTo: `${await origin()}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: error.message };
  return { message: "If an account exists for that email, a reset link is on its way." };
}

export async function resetPassword(_: AuthState, form: FormData): Promise<AuthState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== form.get("confirm")) return { error: "Passwords don't match." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}
