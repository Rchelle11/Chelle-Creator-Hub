import Link from "next/link";
import { Search, PlayCircle, MessagesSquare, BookOpen } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { PostGrid } from "@/components/bottle/PostGrid";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: raw = "" } = await searchParams;
  const q = raw.trim().slice(0, 80);
  const { supabase } = await requireUser();
  const like = `%${q.replace(/[%_,()]/g, " ")}%`;
  const results = q ? await Promise.all([
    supabase.from("courses").select("slug, title, description").eq("published", true).or(`title.ilike.${like},description.ilike.${like}`).limit(5),
    supabase.from("lessons").select("id, title, course:courses(slug)").ilike("title", like).eq("published", true).limit(8),
    supabase.from("posts").select("id, video_url, poster_url, like_count, featured").eq("status", "published").ilike("caption", like).limit(8),
    supabase.from("profiles").select("id, full_name, avatar_url, bio").ilike("full_name", like).eq("is_private", false).limit(8),
    supabase.from("community_posts").select("id, title").or(`title.ilike.${like},body.ilike.${like}`).limit(8),
  ]) : null;
  const [courses, lessons, posts, people, discussions] = results?.map((r) => r.data ?? []) ?? [[], [], [], [], []];
  const empty = q && ![courses, lessons, posts, people, discussions].some((x) => x.length);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <form className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-mute" />
        <input name="q" defaultValue={q} autoFocus placeholder="Search courses, lessons, posts, creators…" className="input h-14 pl-12 text-base" />
      </form>
      {!q && <p className="text-center text-sm text-mute">Try “hooks”, “CapCut”, or a creator&apos;s name.</p>}
      {empty && <p className="text-center text-sm text-mute">No results for “{q}”.</p>}
      {!!courses.length && <Section title="Courses">{(courses as { slug: string; title: string }[]).map((c) => <Row key={c.slug} href={`/courses/${c.slug}`} icon={<BookOpen className="size-4 text-accent" />} text={c.title} />)}</Section>}
      {!!lessons.length && <Section title="Lessons">{(lessons as unknown as { id: string; title: string; course: { slug: string } }[]).map((l) => <Row key={l.id} href={`/courses/${l.course.slug}/${l.id}`} icon={<PlayCircle className="size-4 text-accent" />} text={l.title} />)}</Section>}
      {!!people.length && <Section title="Students">{(people as { id: string; full_name: string; avatar_url: string | null }[]).map((p) => <Row key={p.id} href={`/u/${p.id}`} icon={<Avatar name={p.full_name} src={p.avatar_url} size={28} />} text={p.full_name} />)}</Section>}
      {!!discussions.length && <Section title="Community">{(discussions as { id: string; title: string }[]).map((d) => <Row key={d.id} href={`/community/${d.id}`} icon={<MessagesSquare className="size-4 text-accent" />} text={d.title} />)}</Section>}
      {!!posts.length && <div><h2 className="label mb-3">Battles posts</h2><PostGrid posts={posts as never} /></div>}
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div><h2 className="label mb-3">{title}</h2><div className="glass divide-y divide-line overflow-hidden">{children}</div></div>
);
const Row = ({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) => (
  <Link href={href} className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-white/[0.03]">{icon}{text}</Link>
);
