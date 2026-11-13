"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

// Global mute preference shared by every video in the feed (like TikTok/Reels).
let muted = true;
const subs = new Set<() => void>();
const muteStore = {
  get: () => muted,
  set: (v: boolean) => { muted = v; subs.forEach((f) => f()); },
  sub: (f: () => void) => { subs.add(f); return () => subs.delete(f); },
};

export function VerticalVideo({ src, poster, className, autoPlay = true }: { src: string; poster?: string | null; className?: string; autoPlay?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);       // within ~1 screen: start buffering
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [flash, setFlash] = useState<"play" | "pause" | null>(null);
  const isMuted = useSyncExternalStore(muteStore.sub, muteStore.get, () => true);

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const preload = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "100% 0px" });
    const play = new IntersectionObserver(([e]) => {
      const v = ref.current; if (!v) return;
      if (e.intersectionRatio >= 0.6 && autoPlay) v.play().catch(() => {});
      else v.pause();
    }, { threshold: [0, 0.6] });
    preload.observe(el); play.observe(el);
    return () => { preload.disconnect(); play.disconnect(); };
  }, [autoPlay]);

  useEffect(() => { if (ref.current) ref.current.muted = isMuted; }, [isMuted]);

  const toggle = () => {
    const v = ref.current; if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setFlash("play"); } else { v.pause(); setFlash("pause"); }
    setTimeout(() => setFlash(null), 500);
  };
  const fullscreen = () => {
    const v = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen().catch(() => v.webkitEnterFullscreen?.());
    else v.webkitEnterFullscreen?.();
  };

  return (
    <div ref={wrap} className={cn("relative overflow-hidden bg-black", className)}>
      <video ref={ref} src={near ? src : undefined} poster={poster ?? undefined} loop playsInline muted={isMuted}
        preload={near ? "auto" : "none"} onClick={toggle}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setProgress((e.currentTarget.currentTime / (e.currentTarget.duration || 1)) * 100)}
        className="size-full cursor-pointer object-cover" />
      {flash && (
        <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 animate-pop place-items-center rounded-full bg-black/50 backdrop-blur">
          {flash === "play" ? <Play className="size-7 fill-white" /> : <Pause className="size-7 fill-white" />}
        </span>
      )}
      {!playing && !flash && near && (
        <button onClick={toggle} aria-label="Play" className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/40 backdrop-blur">
          <Play className="size-7 fill-white" />
        </button>
      )}
      <div className="absolute right-3 top-3 flex gap-2">
        <button onClick={() => muteStore.set(!isMuted)} aria-label={isMuted ? "Unmute" : "Mute"} className="grid size-9 place-items-center rounded-full bg-black/45 backdrop-blur transition hover:bg-black/70">
          {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
        <button onClick={fullscreen} aria-label="Fullscreen" className="grid size-9 place-items-center rounded-full bg-black/45 backdrop-blur transition hover:bg-black/70">
          <Maximize2 className="size-4" />
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10"><div className="h-full bg-white/80" style={{ width: `${progress}%` }} /></div>
    </div>
  );
}
