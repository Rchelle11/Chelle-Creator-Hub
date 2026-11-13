import type { ActionResult } from "@/lib/types";

/** Normalize Postgres / Supabase errors into friendly messages for toasts. */
export function fail(error: { message?: string; code?: string } | null | undefined): ActionResult<never> {
  const m = error?.message ?? "Something went wrong. Please try again.";
  if (error?.code === "42501" || /row-level security/i.test(m)) return { ok: false, error: "You don't have permission to do that." };
  if (error?.code === "23505") return { ok: false, error: "That already exists." };
  return { ok: false, error: m };
}
