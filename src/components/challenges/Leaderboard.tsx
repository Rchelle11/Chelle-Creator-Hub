import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

export type LeaderRow = { user_id: string; full_name: string; avatar_url: string | null; score: number; likes: number; posts: number; submissions: number; comments: number; featured: number };
const MEDALS = ["🥇", "🥈", "🥉"];

export function Leaderboard({ rows }: { rows: LeaderRow[] }) {
  if (!rows.length) return <p className="glass p-6 text-center text-sm text-mute">No activity yet this week — post a video to claim the top spot.</p>;
  return (
    <div className="glass divide-y divide-line">
      {rows.map((r, i) => (
        <Link key={r.user_id} href={`/u/${r.user_id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]">
          <span className="w-7 text-center text-lg">{MEDALS[i] ?? <span className="text-sm text-mute">{i + 1}</span>}</span>
          <Avatar name={r.full_name} src={r.avatar_url} size={36} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{r.full_name}</span>
            <span className="block truncate text-[11px] text-mute">{r.posts} videos · {r.submissions} challenge · {r.likes} likes · {r.comments} comments{r.featured ? ` · ⭐ ${r.featured}` : ""}</span>
          </span>
          <span className="text-right"><span className="block text-lg font-semibold">{r.score}</span><span className="block text-[10px] uppercase tracking-wider text-mute">pts</span></span>
        </Link>
      ))}
    </div>
  );
}
