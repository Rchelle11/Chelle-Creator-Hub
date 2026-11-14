import Link from "next/link";
import {
  Lightbulb, Zap, PenLine, Wand2, Scissors, Captions, Send, Clapperboard, ImageIcon, Mic, Music, Bot,
  BookOpen, QrCode, Upload, BadgeCheck, MessageCircle, Trophy, Heart, ArrowRight,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

/** From idea to a published short: mirrors the order of the masterclass modules. */
const STEPS = [
  { icon: Lightbulb, title: "Idea & niche", body: "Pick one viewer and one promise. A clear idea makes every later step faster.", tags: ["Strategy"], quote: "If you can't say it in one line, it isn't ready to film." },
  { icon: Zap, title: "The hook", body: "Write the first three seconds before anything else. It decides whether the rest gets watched.", tags: ["Hooks"], quote: "The hook comes first. Always." },
  { icon: PenLine, title: "Script & story", body: "Hook, tension, payoff. A 30-second story still needs a beginning, a turn and an ending.", tags: ["Storytelling"], quote: "Write how you talk, not how you'd write an essay." },
  { icon: Wand2, title: "Shoot or generate", body: "Film it on your phone, generate it with AI, or mix both. Plan the shots before you make them.", tags: ["Phone", "AI video"], quote: "Plan the shot list first. Then press record or generate." },
  { icon: Scissors, title: "Edit for pace", body: "Cut the pauses, keep the energy. Transitions should have a reason to be there.", tags: ["CapCut"], quote: "If a second doesn't earn its place, cut it." },
  { icon: Captions, title: "Captions & sound", body: "Captions keep people reading. Sound effects and music make the edit feel finished.", tags: ["Captions", "Sound"], quote: "Most people decide with their eyes and stay with their ears." },
  { icon: Send, title: "Publish & improve", body: "Post it, share it in Battles, read the feedback, and make the next one better.", tags: ["Publishing", "Feedback"], quote: "Done and posted beats perfect and saved in drafts." },
];

export function Process() {
  return (
    <section id="process" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-6">
      <p className="eyebrow mb-3 text-center">From an idea to a finished short</p>
      <h2 className="h-display mx-auto max-w-2xl text-center text-4xl md:text-5xl">How a short video <em className="text-accent">gets made</em>.</h2>
      <p className="mx-auto mt-4 max-w-xl text-center text-soft">The same seven steps work whether you film on your phone or build the whole thing with AI.</p>
      <ol className="relative mt-12 space-y-8 md:space-y-10">
        <span className="absolute bottom-2 left-5 top-2 w-px bg-gradient-to-b from-accent via-accent-2 to-transparent md:left-1/2" aria-hidden />
        {STEPS.map(({ icon: Icon, title, body, tags, quote }, i) => (
          <li key={title} className="relative grid gap-3 pl-14 md:grid-cols-2 md:gap-16 md:pl-0">
            <span className="absolute left-0 top-0 grid size-10 place-items-center rounded-full border border-accent/40 bg-ink text-xs font-bold text-accent md:left-1/2 md:-translate-x-1/2">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className={i % 2 ? "md:order-2 md:text-left" : "md:text-right"}>
              <h3 className={`flex items-center gap-2 text-lg font-semibold ${i % 2 ? "" : "md:justify-end"}`}><Icon className="size-4 text-accent" />{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-soft">{body}</p>
              <p className={`mt-3 flex flex-wrap gap-1.5 ${i % 2 ? "" : "md:justify-end"}`}>{tags.map((t) => <span key={t} className="chip">{t}</span>)}</p>
            </div>
            <blockquote className={`h-display self-center text-lg italic text-mute md:text-xl ${i % 2 ? "md:order-1 md:text-right" : ""}`}>“{quote}”</blockquote>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Tool categories taught in the course. Edit this list to name the exact apps you teach. */
const TOOLKIT = [
  { icon: Scissors, name: "CapCut", role: "Editing", body: "Cuts, pacing, transitions and export settings. Works on phone and desktop." },
  { icon: Clapperboard, name: "AI video generators", role: "Visuals", body: "Turn a prompt or a photo into moving shots and b-roll." },
  { icon: ImageIcon, name: "AI image tools", role: "Frames & thumbnails", body: "Create start frames, product shots and cover images." },
  { icon: Mic, name: "AI voice", role: "Voiceover", body: "Clean narration when you don't want to record your own voice." },
  { icon: Music, name: "Music & sound effects", role: "Sound", body: "The layer that makes an edit feel finished." },
  { icon: Bot, name: "AI writing assistants", role: "Ideas & scripts", body: "Brainstorm hooks, outlines and captions, then rewrite them in your voice." },
];

export function Toolkit() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <p className="eyebrow mb-3 text-center">The toolkit</p>
      <h2 className="h-display mx-auto max-w-2xl text-center text-4xl md:text-5xl">The tools you&apos;ll use, and why.</h2>
      <p className="mx-auto mt-4 max-w-xl text-center text-soft">You don&apos;t need every AI tool. You need the right one for each job, and to know how they fit together.</p>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLKIT.map(({ icon: Icon, name, role, body }) => (
          <div key={name} className="glass glass-hover flex gap-4 p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-pure"><Icon className="size-5" /></span>
            <div>
              <p className="font-semibold">{name}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{role}</p>
              <p className="mt-1.5 text-sm text-mute">{body}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-2xl text-center text-lg font-semibold">
        The goal isn&apos;t to master every AI tool. <span className="text-mute">It&apos;s to use the right ones to finish the video.</span>
      </p>
    </section>
  );
}

const JOIN = [
  { icon: BookOpen, title: "Choose a course", body: "Create your free account, open a course and tap Unlock. Free tutorials open right away." },
  { icon: QrCode, title: "Scan & pay", body: "Scan the QR on the checkout page and pay the exact amount shown." },
  { icon: Upload, title: "Upload your receipt", body: "Add the reference number and a screenshot of your receipt." },
  { icon: BadgeCheck, title: "Get confirmed", body: "We confirm your payment and the course unlocks in My Courses." },
];

export function JoinSteps() {
  return (
    <section id="join" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-6">
      <p className="eyebrow mb-3 text-center">How to join</p>
      <h2 className="mx-auto max-w-2xl text-center text-4xl font-extrabold tracking-tight md:text-5xl">Four steps. <span className="text-mute">One QR.</span></h2>
      <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {JOIN.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="glass relative p-5">
            <span className="absolute right-4 top-4 text-xs font-bold text-mute">{String(i + 1).padStart(2, "0")}</span>
            <span className="grid size-11 place-items-center rounded-xl bg-accent/15 text-accent"><Icon className="size-5" /></span>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-mute">{body}</p>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-center text-sm text-mute">Payments are checked by hand, usually within a few hours.</p>
    </section>
  );
}

export function About({ name, bio }: { name: string; bio: string }) {
  return (
    <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-6">
      <div className="glass grid items-center gap-8 p-6 md:grid-cols-[auto_1fr] md:gap-12 md:p-12">
        <Avatar name={name} size={148} className="mx-auto ring-4 ring-accent/30" />
        <div>
          <p className="eyebrow mb-3">About your instructor</p>
          <h2 className="h-display text-4xl md:text-5xl">Hi, I&apos;m {name}.</h2>
          {bio && <p className="mt-4 max-w-2xl leading-relaxed text-soft">{bio}</p>}
          <p className="mt-3 max-w-2xl leading-relaxed text-soft">
            I built this hub to teach short-form video the way I wish I had learned it: one clear step at a time, with real edits, real feedback, and AI as a tool that helps you finish.
          </p>
        </div>
      </div>
    </section>
  );
}

export function Community({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6">
      <p className="eyebrow mb-3">Battles · the creator feed</p>
      <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">A community that learns <em className="h-display font-normal text-accent">out loud.</em></h2>
      <p className="mx-auto mt-5 max-w-xl text-soft">Post your edits, join challenges, and trade honest feedback with other creators. You improve faster when people can see your work.</p>
      <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
        {[[MessageCircle, "Feedback", "Comments on every post"], [Trophy, "Challenges", "Short sprints with a weekly leaderboard"], [Heart, "Featured work", "The best edits get highlighted"]].map(([I, t, d]) => {
          const Icon = I as typeof Heart;
          return <div key={t as string} className="glass p-5"><Icon className="mx-auto size-5 text-accent" /><p className="mt-3 font-semibold">{t as string}</p><p className="mt-1 text-sm text-mute">{d as string}</p></div>;
        })}
      </div>
      <Link href={signedIn ? "/battles" : "/signup?next=%2Fbattles"} className="btn-ghost mt-8">Open Battles <ArrowRight className="size-4" /></Link>
    </section>
  );
}
