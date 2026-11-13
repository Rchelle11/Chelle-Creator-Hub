import Link from "next/link";
import { Lock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { PostForm } from "@/components/bottle/PostForm";

export const metadata = { title: "Post your video" };

export default async function NewPost() {
  const { supabase, user } = await requireUser();
  const [{ data: canPost }, { data: challenges }] = await Promise.all([
    supabase.rpc("has_access"),
    supabase.from("challenges").select("id, title").eq("status", "active").order("end_date"),
  ]);
  return (
    <>
      <PageHeader eyebrow="Bottle" title="Post your video" subtitle="Share your edit with the community and get feedback." />
      {canPost ? <PostForm userId={user.id} challenges={challenges ?? []} /> : (
        <div className="glass p-8 text-center">
          <Lock className="mx-auto size-8 text-accent" />
          <p className="mt-3 font-semibold">Bottle posting is for enrolled students.</p>
          <Link href="/courses" className="btn-primary mt-5">Unlock the Masterclass</Link>
        </div>
      )}
    </>
  );
}
