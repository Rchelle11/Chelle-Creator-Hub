import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { PostForm } from "@/components/bottle/PostForm";

export default async function SubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: c } = await supabase.from("challenges").select("id, title, days, status").eq("id", id).maybeSingle();
  if (!c) notFound();
  const [{ data: me }, { data: subs }] = await Promise.all([
    supabase.from("challenge_participants").select("user_id").eq("challenge_id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("challenge_submissions").select("day").eq("challenge_id", id).eq("user_id", user.id),
  ]);
  if (!me || c.status !== "active") redirect(`/challenges/${id}`);
  return (
    <>
      <PageHeader eyebrow="Challenge submission" title="Submit Your Work" subtitle="Your submission appears in Battles with a challenge badge." />
      <PostForm userId={user.id} challenges={[]} fixedChallenge={{ id: c.id, title: c.title }} days={c.days} doneDays={(subs ?? []).map((s) => s.day)} explanation />
    </>
  );
}
