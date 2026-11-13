import Link from "next/link";
import { LogOut, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader, StatCard } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProfileForm, SettingsForm } from "./AccountForms";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const { supabase, user, profile } = await requireUser();
  const [{ data: enrollments }, { count: lessons }, { data: challenges }] = await Promise.all([
    supabase.from("enrollments").select("progress_percent, status, course:courses(title, slug)").eq("user_id", user.id),
    supabase.from("lesson_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true),
    supabase.from("challenge_participants").select("completed_at, challenge:challenges(id, title)").eq("user_id", user.id),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Account" title="Your studio settings" action={<Link href={`/u/${user.id}`} className="btn-ghost btn-sm">View public profile</Link>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass p-5 md:p-6"><h2 className="label mb-5">Profile</h2><ProfileForm profile={profile} email={user.email ?? ""} /></section>
        <div className="space-y-6">
          <section className="glass p-5 md:p-6">
            <h2 className="label mb-4">Learning</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Courses" value={enrollments?.length ?? 0} />
              <StatCard label="Completed lessons" value={lessons ?? 0} />
            </div>
            <div className="mt-4 space-y-3">
              {(enrollments ?? []).map((e) => {
                const c = e.course as unknown as { title: string; slug: string };
                return (
                  <Link key={c.slug} href={`/courses/${c.slug}`} className="block rounded-xl border border-line p-3 hover:border-line-2">
                    <div className="flex justify-between text-sm"><span className="font-medium">{c.title}</span><span className="text-mute">{e.progress_percent}%</span></div>
                    <ProgressBar value={e.progress_percent} size="sm" className="mt-2" />
                  </Link>
                );
              })}
              {(challenges ?? []).map((c) => {
                const ch = c.challenge as unknown as { id: string; title: string };
                return (
                  <Link key={ch.id} href={`/challenges/${ch.id}`} className="flex items-center justify-between rounded-xl border border-line p-3 text-sm hover:border-line-2">
                    <span>{ch.title}</span><span className="flex items-center gap-1 text-xs text-mute">{c.completed_at ? "✓ Completed" : "In progress"}<ArrowRight className="size-3" /></span>
                  </Link>
                );
              })}
              <Link href="/payment-status" className="block text-xs text-mute hover:text-white">Payment history →</Link>
            </div>
          </section>
          <section className="glass p-5 md:p-6"><h2 className="label mb-2">Settings</h2><SettingsForm profile={profile} /></section>
          <form action="/auth/signout" method="post"><button className="btn-danger w-full"><LogOut className="size-4" /> Logout</button></form>
        </div>
      </div>
    </div>
  );
}
