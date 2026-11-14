import Link from "next/link";
import {
  ArrowRight, Plus, Sparkles, Zap, BookOpen, Wand2, Scissors, Captions, Volume2, Shuffle, Eye, CalendarRange, Send, Wallet,
  Check, Play, Heart, Users, Briefcase, Smartphone, Building2, Film, Bot, GraduationCap,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { About, Community, JoinSteps, Process, Toolkit } from "@/components/landing/Sections";
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

const FAQ = [
  { q: "How do I pay?", a: "Pay with GCash, GoTyme, or PayPal if you're outside the Philippines. The checkout page shows the QR code and the exact amount. After paying, upload a screenshot of your receipt with the reference number." },
  { q: "How long until my course unlocks?", a: "We check every payment by hand, so it usually takes a few hours. You'll get a notification in the app as soon as it's confirmed, and the course opens right away." },
  { q: "Is there anything I can watch for free?", a: "Yes. Create a free account to watch the free tutorials and the preview lessons before you decide to join the masterclass." },
  { q: "Do I need experience or expensive gear?", a: "No. The lessons start from zero, and a phone is enough. A laptop helps with longer edits, but it isn't required." },
  { q: "Which tools will I use?", a: "CapCut for editing, plus the AI video tools covered in the AI module. Each lesson tells you what you need, and you can begin with free versions where they're available." },
  { q: "I don't make AI videos. Is this still for me?", a: "Yes. Hooks, storytelling, pacing, captions and sound apply to every short video. The AI lessons are one module you can use whenever you're ready." },
  { q: "Do I keep access?", a: "Yes. It's a one-time payment, and you keep access to the lessons and the creator community." },
  { q: "What is Battles?", a: "Battles is the student feed. Post your edits, join challenges, and get feedback from other creators." },
];

// Optional public contact links, set in the environment (Vercel → Settings → Environment Variables).
const CONTACT = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL,
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL,
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
};

async function getData() {
  if (!isConfigured) return { price: 5499, modules: FALLBACK_MODULES, posts: [] as Showcase[], signedIn: false, free: [] as CourseItem[], courses: [] as CourseItem[], instructor: { name: "Chelle", bio: "" } };
  const supabase = await createClient();
  const [{ data: course }, { data: auth }] = await Promise.all([
    supabase.from("courses").select("id, price").eq("slug", SLUG).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  const [{ data: allCourses }, { data: allLessons }, { data: main }] = await Promise.all([
    supabase.from("courses").select("id, slug, title, description, thumbnail_url, price").eq("published", true).order("price", { ascending: false }).order("created_at").limit(9),
    supabase.from("lessons").select("course_id").eq("published", true),
    supabase.from("courses").select("instructor_name, instructor_bio").eq("slug", SLUG).maybeSingle(),
  ]);
  const courses = (allCourses ?? []).map((c) => ({ ...c, price: Number(c.price), lessons: (allLessons ?? []).filter((l) => l.course_id === c.id).length })) as CourseItem[];
  const [{ data: modules }, { data: lessons }, { data: posts }] = await Promise.all([
    supabase.from("modules").select("id, title, position").eq("course_id", course?.id ?? "").order("position"),
    supabase.from("lessons").select("module_id").eq("course_id", course?.id ?? ""),
    supabase.from("posts").select("id, video_url, poster_url, caption, like_count, author:profiles!posts_user_id_fkey(full_name)")
      .eq("featured", true).eq("status", "published").order("like_count", { ascending: false }).limit(4),
  ]);
  return {
    price: Number(course?.price ?? 5499),
    modules: modules?.length
      ? modules.map((m) => ({ title: m.title, count: (lessons ?? []).filter((l) => l.module_id === m.id).length }))
      : FALLBACK_MODULES,
    posts: (posts ?? []) as unknown as Showcase[],
    signedIn: !!auth.user,
    free: courses.filter((c) => c.price === 0),
    courses,
    instructor: { name: main?.instructor_name || "Chelle", bio: main?.instructor_bio ?? "" },
  };
}
type CourseItem = { id: string; slug: string; title: string; description: string; thumbnail_url: string | null; lessons: number; price: number };
type Showcase = { id: string; video_url: string; poster_url: string | null; caption: string; like_count: number; author: { full_name: string } | null };

export default async function Landing() {
  const { price, modules, posts, signedIn, free, courses, instructor } = await getData();
  const freeHref = (slug: string) => (signedIn ? `/courses/${slug}` : `/signup?next=${encodeURIComponent(`/courses/${slug}`)}`);
  const courseHref = (c: CourseItem) => (c.price === 0 ? freeHref(c.slug) : signedIn ? `/courses/${c.slug}` : `/signup?next=${encodeURIComponent(`/checkout/${c.slug}`)}`);
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
      <section id="learn" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-6">
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

      <Process />
      <Toolkit />

      {/* Courses (paid + free) */}
      {courses.length > 0 && (
        <section id="courses" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-6">
          <span id="free" className="block scroll-mt-24" />
          <p className="eyebrow mb-3">Courses</p>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Learn how to make it.<br /><span className="text-accent">{free.length > 0 ? "Start for free." : "Then publish it."}</span></h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link key={c.id} href={courseHref(c)} className="glass glass-hover group flex flex-col overflow-hidden">
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-accent/40 to-ink-3">
                  {c.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail_url} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" />
                  )}
                  <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-[11px] font-semibold text-pure backdrop-blur">{c.lessons} lessons</span>
                  {c.price === 0 && <span className="absolute right-3 top-3 rounded-lg bg-ok px-3 py-1 text-sm font-black tracking-widest text-black/85 shadow-lg">FREE</span>}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-semibold leading-snug">{c.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-mute">{c.description}</p>
                  <p className="mt-auto flex items-center justify-between pt-5">
                    <span className={`h-display text-2xl ${c.price === 0 ? "text-ok" : ""}`}>{c.price === 0 ? "Free" : peso(c.price)}</span>
                    <span className="btn-ghost btn-sm">{c.price === 0 ? "Watch free" : "View course"} <ArrowRight className="size-3.5" /></span>
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

      {/* Watch the work */}
      {posts.length > 0 && (
        <section id="work" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-6">
          <p className="eyebrow mb-3">Featured in Battles</p>
          <h2 className="max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">Watch the work. <span className="text-mute">Then learn how it was made.</span></h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="relative mx-auto aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl border border-line bg-black text-pure">
              <video src={posts[0].video_url} poster={posts[0].poster_url ?? undefined} muted loop playsInline autoPlay preload="metadata" className="size-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5 pt-20">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-pure/70">Top pick</p>
                <p className="mt-1 text-lg font-semibold">{posts[0].author?.full_name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-pure/80">{posts[0].caption}</p>
              </div>
            </div>
            <div>
              <p className="mb-4 text-sm font-semibold">Top featured</p>
              <ol className="space-y-3">
                {posts.map((p, i) => (
                  <li key={p.id} className="glass flex items-center gap-4 p-3">
                    <span className="h-display w-10 text-center text-4xl text-mute">{i + 1}</span>
                    <div className="relative aspect-[9/16] w-14 shrink-0 overflow-hidden rounded-lg bg-black">
                      <video src={p.video_url} poster={p.poster_url ?? undefined} muted playsInline preload="metadata" className="size-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.author?.full_name}</p>
                      <p className="line-clamp-1 text-sm text-mute">{p.caption}</p>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-mute"><Heart className="size-4 fill-accent-2 text-accent-2" />{p.like_count}</span>
                  </li>
                ))}
              </ol>
              <Link href={signedIn ? "/battles" : "/signup?next=%2Fbattles"} className="btn-primary mt-6">Create a free account to watch <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </section>
      )}

      <JoinSteps />
      <About name={instructor.name} bio={instructor.bio} />
      <Community signedIn={signedIn} />

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

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 md:px-6">
        <p className="eyebrow mb-3 text-center">Questions</p>
        <h2 className="h-display mb-8 text-center text-4xl md:text-5xl">Before you join</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <details key={f.q} open={i === 0} className="glass group overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-semibold md:px-6 md:py-5">
                {f.q}
                <Plus className="size-4 shrink-0 text-mute transition-transform duration-200 group-open:rotate-45" />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-soft md:px-6">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing call to action */}
      <section className="relative overflow-hidden px-4 py-24 text-center md:py-36">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[min(900px,120vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/25 blur-[100px]" />
        <h2 className="relative text-[17vw] font-black leading-[0.9] tracking-tighter md:text-[150px]">Let&apos;s create.</h2>
        <p className="relative mt-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-mute">
          {free.length > 0 ? "Free tutorials inside · " : ""}Pay once · Learn at your pace
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={signedIn ? "/courses" : "/signup?next=%2Fcourses"} className="btn-primary h-13 px-8 text-[15px]">Browse courses <ArrowRight className="size-4" /></Link>
          {!signedIn && <Link href="/signup" className="btn-ghost h-13 px-8 text-[15px]">Create account</Link>}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
          <div>
            <Logo />
            <p className="h-display mt-5 max-w-xs text-xl italic text-soft">Learn it. Create it. Edit it. Publish it.</p>
          </div>
          <nav aria-label="Explore">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-mute">Explore</p>
            <ul className="space-y-2.5 text-sm text-soft">
              <li><a href="#courses" className="hover:text-white">Courses</a></li>
              <li><a href="#learn" className="hover:text-white">What you&apos;ll learn</a></li>
              {free.length > 0 && <li><a href="#free" className="hover:text-white">Free tutorials</a></li>}
              <li><a href="#join" className="hover:text-white">How to join</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              <li><Link href="/courses" className="hover:text-white">My courses</Link></li>
            </ul>
          </nav>
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-mute">Contact</p>
            <ul className="space-y-2.5 text-sm text-soft">
              {CONTACT.email && <li><a href={`mailto:${CONTACT.email}`} className="hover:text-white">{CONTACT.email}</a></li>}
              {CONTACT.facebook && <li><a href={CONTACT.facebook} target="_blank" rel="noreferrer" className="hover:text-white">Facebook</a></li>}
              {CONTACT.tiktok && <li><a href={CONTACT.tiktok} target="_blank" rel="noreferrer" className="hover:text-white">TikTok</a></li>}
              {CONTACT.instagram && <li><a href={CONTACT.instagram} target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a></li>}
              <li><Link href="/messages" className="hover:text-white">Message us in the app</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 pb-10 text-xs text-mute sm:flex-row md:px-6">
          <p>© {new Date().getFullYear()} Chelle Creator Hub</p>
          <p>GCash · GoTyme · PayPal — payments confirmed manually</p>
        </div>
      </footer>
    </div>
  );
}
