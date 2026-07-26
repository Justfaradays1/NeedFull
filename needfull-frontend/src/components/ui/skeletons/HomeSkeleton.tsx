import { Skeleton, SkeletonLine, SkeletonCircle, SkeletonCard, SkeletonStatCard } from '../skeleton';

export function GreetingCardSkeleton() {
  return (
    <div className="rounded-2xl bg-brand p-5 text-white shadow-sm">
      <div className="flex items-center gap-3">
        <SkeletonCircle size="48px" />
        <div className="space-y-2 flex-1">
          <SkeletonLine width="140px" height="16px" />
          <SkeletonLine width="100px" height="12px" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <SkeletonLine width="80px" height="10px" />
        <SkeletonLine width="120px" height="28px" />
      </div>
    </div>
  );
}

export function WalletCardSkeleton() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-sm">
      <SkeletonLine width="80px" height="10px" />
      <SkeletonLine width="140px" height="32px" className="mt-2" />
      <div className="mt-4 flex gap-3">
        <Skeleton className="flex-1 rounded-xl" style={{ height: 44 }} />
        <Skeleton className="flex-1 rounded-xl" style={{ height: 44 }} />
      </div>
    </div>
  );
}

export function CategoryPillsSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="rounded-full shrink-0" style={{ width: 80, height: 32 }} />
      ))}
    </div>
  );
}

export function TaskCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="space-y-5 px-4 py-4">
      <GreetingCardSkeleton />
      <WalletCardSkeleton />
      <div className="space-y-2">
        <SkeletonLine width="120px" height="18px" />
        <CategoryPillsSkeleton />
      </div>
      <div className="space-y-2">
        <SkeletonLine width="100px" height="18px" />
        <TaskCardsSkeleton />
      </div>
    </div>
  );
}
