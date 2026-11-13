import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import type { Challenge } from "@/lib/types";
import { Badge } from "@/components/ui/PageHeader";

export function daysLeft(end: string) {
  return Math.ceil((new Date(end + "T23:59:59").getTime() - Date.now()) / 86400000);
}

export function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export function ChallengeCard({ c, participants, joined }: { c: Challenge; participants: number; joined: boolean }) {
  const left = daysLeft(c.end_date);
  return (
    <Link href={`/challenges/${c.id}`} className="glass glass-hover group block overflow-hidden">
      <div className="relative aspect-[16/8] overflow-hidden">
        {c.cover_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={c.cover_url} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" />
          : <div className="size-full bg-gradient-to-br from-accent/40 to-ink-3" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          {c.status === "ended" || left < 0 ? <Badge>Ended</Badge> : <Badge tone="accent">● Live</Badge>}
          {joined && <Badge tone="ok">Joined</Badge>}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold">{c.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-mute">{c.description}</p>
        <div className="mt-4 flex gap-4 text-xs text-soft">
          <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-accent" />{left >= 0 ? `${left} days left` : "Closed"}</span>
          <span className="flex items-center gap-1.5"><Users className="size-3.5 text-accent" />{participants} creators</span>
        </div>
      </div>
    </Link>
  );
}
