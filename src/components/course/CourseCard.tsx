import Link from "next/link";
import { ArrowRight, Layers, PlayCircle } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EnrollFreeButton } from "./EnrollFreeButton";
import { peso } from "@/lib/utils";

export function CourseCard({ slug, title, description, thumbnail, modules, lessons, percent, lastLesson, enrolled, continueHref, courseId, price }: {
  slug: string; title: string; description: string; thumbnail: string | null; modules: number; lessons: number;
  percent: number; lastLesson?: string | null; enrolled: boolean; continueHref: string; courseId: string; price: number;
}) {
  return (
    <article className="glass glass-hover group grid overflow-hidden md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Link href={`/courses/${slug}`} className="relative aspect-video overflow-hidden md:aspect-auto">
        {thumbnail
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={thumbnail} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" />
          : <div className="size-full bg-gradient-to-br from-accent/40 to-ink-3" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent md:bg-gradient-to-r md:from-transparent md:to-ink/80" />
        {price === 0 && <span className="absolute left-3 top-3 rounded-lg bg-ok px-3 py-1 text-sm font-black tracking-widest text-black/85 shadow-lg">FREE</span>}
      </Link>
      <div className="flex flex-col p-5 md:p-7">
        {!enrolled && (
          <span className={`mb-2 w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wider ${price === 0 ? "border-ok/30 bg-ok/10 text-ok" : "border-line bg-white/[0.05] text-soft"}`}>
            {price === 0 ? "FREE" : peso(price)}
          </span>
        )}
        <h3 className="h-display text-3xl leading-tight">{title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-mute">{description}</p>
        <div className="mt-4 flex gap-4 text-xs text-soft">
          <span className="flex items-center gap-1.5"><Layers className="size-3.5 text-accent" />{modules} modules</span>
          <span className="flex items-center gap-1.5"><PlayCircle className="size-3.5 text-accent" />{lessons} lessons</span>
        </div>
        {enrolled ? (
          <>
            <div className="mt-6 flex items-center justify-between text-xs">
              <span className="font-semibold">{percent}% Complete</span>
              {lastLesson && <span className="truncate pl-3 text-mute">Last: {lastLesson}</span>}
            </div>
            <ProgressBar value={percent} className="mt-2" />
            <Link href={continueHref} className="btn-primary mt-6 w-full md:w-fit">{percent === 0 ? "Start Learning" : "Continue Learning"} <ArrowRight className="size-4" /></Link>
          </>
        ) : price === 0 ? (
          <EnrollFreeButton courseId={courseId} href={continueHref} className="mt-6 w-full md:w-fit" />
        ) : (
          <Link href={`/checkout/${slug}`} className="btn-primary mt-6 w-full md:w-fit">Unlock course <ArrowRight className="size-4" /></Link>
        )}
      </div>
    </article>
  );
}
