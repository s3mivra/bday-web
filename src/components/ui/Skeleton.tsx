import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-xl bg-ink-veil/60 motion-reduce:animate-none', className)}
    />
  );
}

export function SectionSkeleton() {
  return (
    <div className="shell space-y-6 py-20">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-14 w-full max-w-xl" />
      <Skeleton className="h-4 w-full max-w-2xl" />
      <Skeleton className="h-4 w-3/4 max-w-xl" />
    </div>
  );
}
