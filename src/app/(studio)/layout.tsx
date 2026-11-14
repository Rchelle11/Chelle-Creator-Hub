import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/nav/Sidebar";
import { BottomNav } from "@/components/nav/BottomNav";
import { TopBar } from "@/components/nav/TopBar";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireUser();
  const [{ count }, { count: freeCount }] = await Promise.all([
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).eq("read", false),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("published", true).eq("price", 0),
  ]);
  const freeTag = (freeCount ?? 0) > 0;
  return (
    <div className="grain flex min-h-dvh">
      <Sidebar variant="student" name={profile.full_name} avatar={profile.avatar_url} isAdmin={profile.role === "admin"}
        badges={{ "/messages": count ?? 0 }} freeTag={freeTag} />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopBar userId={user.id} isAdmin={profile.role === "admin"} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-8">{children}</main>
      </div>
      <BottomNav freeTag={freeTag} />
    </div>
  );
}
