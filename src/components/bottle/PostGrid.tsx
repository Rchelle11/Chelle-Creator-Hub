import Link from "next/link";
import { Heart, Star } from "lucide-react";

export function PostGrid({ posts }: { posts: { id: string; video_url: string; poster_url: string | null; like_count: number; featured: boolean }[] }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 md:grid-cols-4 md:gap-3">
      {posts.map((p) => (
        <Link key={p.id} href={`/battles/${p.id}`} className="group relative aspect-[9/16] overflow-hidden rounded-xl border border-line bg-black text-pure">
          <video src={p.video_url} poster={p.poster_url ?? undefined} muted playsInline preload="metadata" className="size-full object-cover transition duration-500 group-hover:scale-105" />
          <span className="absolute bottom-1.5 left-2 flex items-center gap-1 text-xs font-semibold drop-shadow"><Heart className="size-3.5 fill-pure" />{p.like_count}</span>
          {p.featured && <Star className="absolute right-2 top-2 size-4 fill-gold text-gold" />}
        </Link>
      ))}
    </div>
  );
}
