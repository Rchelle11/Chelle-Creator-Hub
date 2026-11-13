import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const isLocalSupabase = /^https?:\/\/(127\.0\.0\.1|localhost)/.test(supabaseUrl);

const nextConfig: NextConfig = {
  // Local dev only: lets other devices reach a local Supabase through the app's own origin.
  async rewrites() {
    return isLocalSupabase ? [{ source: "/supabase/:path*", destination: `${supabaseUrl}/:path*` }] : [];
  },
};

export default nextConfig;
