import Link from "next/link";
import { Check, Lock, Play } from "lucide-react";
import type { OutlineModule } from "@/lib/course";
import { cn, duration } from "@/lib/utils";

export function ModuleList({ outline, slug, currentId, compact }: { outline: OutlineModule[]; slug: string; currentId?: string; compact?: boolean }) {
  return (
    <div className="space-y-3">
      {outline.map((m) => {
        const done = m.lessons.filter((l) => l.state === "completed").length;
        return (
          <section key={m.id} className="glass overflow-hidden">
            <header className={cn("flex items-start justify-between gap-3 border-b border-line", compact ? "px-4 py-3" : "px-5 py-4")}>
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-accent">MODULE {m.position}</p>
                <h3 className={cn("mt-1 font-semibold", compact ? "text-sm" : "text-base")}>{m.title}</h3>
              </div>
              <span className="shrink-0 pt-1 text-xs text-mute">{done}/{m.lessons.length}</span>
            </header>
            <ol>
              {m.lessons.map((l) => {
                const active = l.id === currentId;
                const inner = (
                  <>
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                      l.state === "completed" ? "border-ok/30 bg-ok/15 text-ok"
                        : l.state === "locked" ? "border-line text-mute" : "border-accent/40 bg-accent/10 text-accent")}>
                      {l.state === "completed" ? <Check className="size-4" /> : l.state === "locked" ? <Lock className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-sm", l.state === "locked" ? "text-mute" : "font-medium")}>{l.lessonIndex}. {l.title}</span>
                      <span className="mt-0.5 block text-[11px] text-mute">
                        {duration(l.duration_seconds)}{l.is_preview && l.state !== "completed" ? " · Free preview" : ""}
                        {l.state === "completed" ? " · Completed" : l.state === "locked" ? " · Locked" : ""}
                      </span>
                    </span>
                  </>
                );
                const cls = cn("flex items-center gap-3 border-b border-line/50 last:border-0", compact ? "px-4 py-2.5" : "px-5 py-3.5",
                  active && "bg-accent/[0.08]");
                return (
                  <li key={l.id}>
                    {l.state === "locked"
                      ? <div className={cn(cls, "cursor-not-allowed opacity-70")}>{inner}</div>
                      : <Link href={`/courses/${slug}/${l.id}`} className={cn(cls, "transition hover:bg-white/[0.04]")}>{inner}</Link>}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
