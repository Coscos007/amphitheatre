import { cn } from "../../lib/cn.ts";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-[var(--radius-control)]", className)} />;
}

export function TheaterSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-page p-4">
      <Skeleton className="mb-4 h-12 w-full" />
      <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="min-h-64 w-full" />
        <div className="hidden flex-col gap-3 lg:flex">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
      <Skeleton className="mt-4 h-14 w-full" />
    </div>
  );
}
