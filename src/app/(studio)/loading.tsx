import { Skeleton } from "@/components/ui/PageHeader";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-12 w-2/3 max-w-md" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
    </div>
  );
}
