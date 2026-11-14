import Link from "next/link";
import {
  ArrowRight, Sparkles, Zap, BookOpen, Wand2, Scissors, Captions, Volume2, Shuffle, Eye, CalendarRange, Send, Wallet,
  Check, Play, Heart, Users, Briefcase, Smartphone, Building2, Film, Bot, GraduationCap,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/env";
import { peso } from "@/lib/utils";

const LEARN = [
  { icon: Sparkles, t: "Short-form video strategy" }, { icon: Zap, t: "Hooks" }, { icon: BookOpen, t: "Storytelling" },
  { icon: Wand2, t: "AI video creation" }, { icon: Scissors, t: "Editing" }, { icon: Captions, t: "Captions" },
  { icon: Volume2, t: "Sound effects" }, { icon: Shuffle, t: "Transitions" }, { icon: Eye, t: "Visual storytelling" },
  { icon: CalendarRange, t: "Content strategy" }, { icon: Send, t: "Publishing" }, { icon: Wallet, t: "Monetization" },
];
const FOR = [
  { icon: GraduationCap, t: "Beginners" }, { icon: Smartphone, t: "Content creators" }, { icon: Briefcase, t: "Freelancers" },
  { icon: Users, t: "Social media managers" }, { icon: Building2, t: "Business owners" }, { icon: Film, t: "Video editors" },
  { icon: Bot, t: "Aspiring AI creators" },
];
const FALLBACK_MODULES = [
  { title: "Introduction to Short Video Creation", count: 4 }, { title: "Hooks & Storytelling", count: 3 },
  { title: "AI Video Creation", count: 3 }, { title: "Editing That Feels Premium", count: 4 }, { title: "Publish, Grow & Monetize", count: 2 },
];
const SLUG = "short-video-masterclass";

async function getData() {
  if (!isConfigured) return { price: 5499, modules: FALLBACK_MODULES, posts: [] as Showcase[], signedIn: false, free: [] as FreeCourse[] };
  const supabase = await createClient();
  const [{ data: course }, { data: auth }] = await Promise.all([
    supabase.from("courses").select("id, price").eq("slug", SLUG).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  const [{ data: free }, { data: freeLessons }] = await Promise.all([
    supabase.from("courses").select("id, slug, title, description, thumbnail_url").eq("published", true).eq("price", 0).order("created_at").limit(3),
    supabase.from("lessons").select("course_id").eq("published", true),
  ]);
  const [{ data: modules }, { data: lessons }, { data: posts }] = await Promise.all([
    supabase.from("modules").select("id, title, position").eq("course_id", course?.id ?? "").order("position"),
    supabase.from("lessons").select("module_id").eq("course_id", course?.id ?? ""),
    supabase.from("posts").select("id, video_url, poster_url, caption, like_count, author:profiles!posts_user_id_fkey(full_name)")
      .eq("featured", true).eq("status", "published").order("created_at", { ascending: false }).limit(4),
  ]);
  return {
    price: Number(course?.price ?? 5499),
    modules: modules?.length
      ? modules.map((m) => ({ title: m.title, count: (lessons ?? []).filter((l) => l.module_id === m.id).length }))
      : FALLBACK_MODULES,
    posts: (posts ?? []) as unknown as Showcase[],
    signedIn: !!auth.user,
    free: (free ?? []).map((c) => ({ ...c, lessons: (freeLessons ?? []).filter((l) => l.course_id === c.id).length })) as FreeCourse[],
  };
}
type FreeCourse = { id: string; slug: string; title: string; description: string; thumbnail_url: string | null; lessons: number };
type Showcase = { id: string; video_url: string; poster_url: string | null; caption: string; like_count: number; author: { full_name: string } | null };

export default async function Landing() {
  const { price, modules, posts, signedIn, free } = await getData();
  const freeHref = (slug: string) => (signedIn ? `/courses/${slug}` : `/signup?next=${encodeURIComponent(`/courses/${slug}`)}`);
  const totalLessons = modules.reduce((a, m) => a + m.count, 0);

  return (
    <div className="grain relative overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-line/60 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {signedIn ? (
              <Link href="/dashboard" className="btn-primary btn-sm">Open Studio</Link>
            ) : (
              <>
                {free.length > 0 && <a href="#free" className="btn-quiet btn-sm hidden sm:inline-flex"><span className="rounded bg-ok px-1.5 py-0.5 text-[10px] font-black tracking-wider text-black/85">FREE</span> Tutorials</a>}
                <Link href="/login" className="btn-quiet btn-sm px-2 sm:px-3.5">Login</Link>
                <Link href="/signup" className="btn-primary btn-sm"><span className="sm:hidden">Join</span><span className="hidden sm:inline">Start Learning</span></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 md:grid-cols-[1.15fr_0.85fr] md:px-6 md:pt-24">
        <div className="animate-fade-up">
          <p className="eyebrow mb-5">Short Video Masterclass</p>
          <h1 className="h-display text-[52px] leading-[0.95] md:text-[84px]">
            Create better<br />short videos. <em className="text-accent">Faster.</em>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-soft md:text-lg">
            Learn how to plan, create, edit, and publish engaging short-form videos using AI and modern editing techniques.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={`/checkout/${SLUG}`} className="btn-primary h-13 px-7 text-[15px]">Start Learning <ArrowRight className="size-4" /></Link>
            <a href="#curriculum" className="btn-ghost h-13 px-7 text-[15px]">Explore the Masterclass</a>
          </div>
          {free.length > 0 && (
            <a href="#free" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ok hover:underline">
              <span className="rounded bg-ok px-2 py-0.5 text-[11px] font-black tracking-wider text-black/85">FREE</span> Not ready yet? Watch the free tutorials first →
            </a>
          )}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-mute">
            <span className="flex items-center gap-2"><Check className="size-4 text-ok" /> {totalLessons} video lessons</span>
            <span className="flex items-center gap-2"><Check className="size-4 text-ok" /> Creator community</span>
            <span className="flex items-center gap-2"><Check className="size-4 text-ok" /> Lifetime access</span>
          </div>
        </div>

        {/* Phone mock */}
        <div className="relative mx-auto w-[260px] md:w-[300px]">
          <div className="absolute -inset-10 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative aspect-[9/19] overflow-hidden rounded-[44px] border-[6px] border-black/60 bg-black text-pure shadow-2xl">
            <video src={posts[0]?.video_url ?? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"}
              poster={posts[0]?.poster_url ?? undefined}
              className="size-full object-cover opacity-90" autoPlay muted loop playsInline preload="metadata" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5 pt-20">
              <p className="text-xs font-semibold">@{(posts[0]?.author?.full_name ?? "maria").split(" ")[0].toLowerCase()}</p>
              <p className="mt-1 line-clamp-2 text-xs text-pure/80">{posts[0]?.caption ?? "My first AI product commercial!"}</p>
            </div>
            <div className="absolute bottom-24 right-3 flex flex-col items-center gap-4 text-xs">
              <span className="grid place-items-center"><Heart className="size-6 fill-accent text-accent" />{posts[0]?.like_count ?? 128}</span>
            </div>
            <div className="absolute left-1/2 top-3 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
          </div>
        </div>
      </section>

      {/* What you'll learn */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <p className="eyebrow mb-3">What you&apos;ll learn</p>
        <h2 className="h-display max-w-2xl text-4xl md:text-5xl">Everything between an idea and a finished edit.</h2>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {LEARN.map(({ icon: Icon, t }) => (
            <div key={t} className="glass glass-hover flex items-center gap-3 p-4">
              <Icon className="size-5 shrink-0 text-accent" strokeWidth={1.7} />
              <span className="text-sm font-medium">{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Free tutorials */}
      {free.length > 0 && (
        <section id="free" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ok">Free tutorials</p>
          <h2 className="h-display max-w-2xl text-4xl md:text-5xl">Start learning for <em className="text-ok">free</em>.</h2>
          <p className="mt-3 max-w-xl text-soft">Create a free account and watch these lessons right away. No payment needed.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {free.map((c) => (
              <Link key={c.id} href={freeHref(c.slug)} className="glass glass-hover group overflow-hidden">
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-ok/30 to-ink-3">
                  {c.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail_url} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" />
                  )}
                  <span className="absolute left-3 top-3 rounded-lg bg-ok px-3 py-1 text-sm font-black tracking-widest text-black/85 shadow-lg">FREE</span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold">{c.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-mute">{c.description}</p>
                  <p className="mt-4 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-xs text-mute"><Play className="size-3.5" /> {c.lessons} free lessons</span>
                    <span className="font-semibold text-ok">Watch free →</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Who it's for */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="glass grid gap-10 p-6 md:grid-cols-[0.9fr_1.1fr] md:p-12">
          <div>
            <p className="eyebrow mb-3">Who it&apos;s for</p>
            <h2 className="h-display text-4xl md:text-5xl">Built for people who want to <em>make</em> things.</h2>
            <p className="mt-4 text-soft">No film degree. No expensive gear. Just your phone, a laptop if you have one, and a willingness to post your work.</p>
          </div>
          <div className="flex flex-wrap content-center gap-2.5">
            {FOR.map(({ icon: Icon, t }) => (
              <span key={t} className="flex items-center gap-2 rounded-full border border-line-2 bg-white/[0.03] px-4 py-2.5 text-sm">
                <Icon className="size-4 text-gold" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section id="curriculum" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Course preview</p>
            <h2 className="h-display text-4xl md:text-5xl">The curriculum</h2>
          </div>
          <p className="text-sm text-mute">{modules.length} modules · {totalLessons} lessons</p>
        </div>
        <div className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {modules.map((m, i) => (
            <div key={m.title} className="glass glass-hover group relative w-[78%] shrink-0 snap-start overflow-hidden p-6 md:w-auto">
              <span className="h-display absolute -right-2 -top-6 text-[120px] leading-none text-white/[0.04] transition group-hover:text-accent/10">{i + 1}</span>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-accent">MODULE {i + 1}</p>
              <h3 className="mt-3 text-lg font-semibold leading-snug">{m.title}</h3>
              <p className="mt-6 flex items-center gap-2 text-xs text-mute"><Play className="size-3.5" /> {m.count} lessons</p>
            </div>
          ))}
        </div>
      </section>

      {/* Student work */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <p className="eyebrow mb-3">Student work · from Battles</p>
          <h2 className="h-display text-4xl md:text-5xl">Made by students like you.</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {posts.map((p) => (
              <div key={p.id} className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-line bg-black text-pure">
                <video src={p.video_url} poster={p.poster_url ?? undefined} muted loop playsInline autoPlay preload="metadata" className="size-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-12">
                  <p className="text-xs font-semibold">{p.author?.full_name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-pure/80">{p.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pricing / CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-line-2 bg-gradient-to-b from-ink-3 to-ink-2 p-8 text-center md:p-16">
          <div className="absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/25 blur-3xl" />
          <p className="eyebrow relative mb-4">Join the masterclass</p>
          <h2 className="h-display relative mx-auto max-w-2xl text-4xl md:text-6xl">Ready to create your first short video?</h2>
          <p className="relative mt-6 text-5xl font-semibold tracking-tight">{peso(price)}</p>
          <p className="relative mt-2 text-sm text-mute">One-time payment · GCash, GoTyme or PayPal</p>
          <Link href={`/checkout/${SLUG}`} className="btn-primary relative mt-8 h-13 px-8 text-[15px]">Join the Masterclass <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-mute md:flex-row md:px-6">
          <Logo />
          <p>Learn. Create. Edit. Publish.</p>
          <p>© {new Date().getFullYear()} CHELLE CREATOR HUB</p>
        </div>
      </footer>
    </div>
  );
}
