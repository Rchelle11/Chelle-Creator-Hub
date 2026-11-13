"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { COOKIE_OPTIONS, SUPABASE_KEY, browserSupabaseUrl } from "./env";

let client: SupabaseClient | undefined;
export function createClient(): SupabaseClient {
  client ??= createBrowserClient(browserSupabaseUrl(), SUPABASE_KEY, { cookieOptions: COOKIE_OPTIONS });
  return client;
}
