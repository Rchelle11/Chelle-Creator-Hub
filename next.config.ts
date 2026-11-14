import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const isLocalSupabase = /^https?:\/\/(127\.0\.0\.1|localhost)/.test(supabaseUrl);

const nextConfig: NextConfig = {
  // "Bottle" was renamed to "Battles"; keep old links (and saved notifications) working.
  async redirects() {
    return [
      { source: "/bottle", destination: "/battles", permanent: true },
      { source: "/bottle/:path*", destination: "/battles/:path*", permanent: true },
      { source: "/admin/bottle", destination: "/admin/battles", permanent: true },
    ];
  },
  // Local dev only: lets other devices reach a local Supabase through the app's own origin.
  async rewrites() {
    return isLocalSupabase ? [{ source: "/supabase/:path*", destination: `${supabaseUrl}/:path*` }] : [];
  },
};

export default nextConfig;
