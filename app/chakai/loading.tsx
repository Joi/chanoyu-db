import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingChakai() {
  return (
    <div className="space-y-2 p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded border border-border bg-card p-3">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}


