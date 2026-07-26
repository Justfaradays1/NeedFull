import { Skeleton, SkeletonLine, SkeletonCard } from '../skeleton';

export function WalletBalanceSkeleton() {
  return (
    <div className="mx-4 mt-4 sm:mx-6">
      <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-sm">
        <div className="space-y-1">
          <SkeletonLine width="100px" height="12px" />
          <SkeletonLine width="150px" height="36px" />
          <SkeletonLine width="80px" height="12px" />
          <SkeletonLine width="120px" height="12px" />
        </div>
        <div className="mt-5 flex gap-3">
          <Skeleton className="flex-1 rounded-lg" style={{ height: 48 }} />
          <Skeleton className="flex-1 rounded-lg" style={{ height: 48 }} />
        </div>
      </div>
    </div>
  );
}

export function WalletTransactionsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="mx-4 mt-6 sm:mx-6 space-y-2">
      <SkeletonLine width="120px" height="16px" />
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-card-border bg-surface p-3">
            <Skeleton className="rounded-full" style={{ width: 36, height: 36 }} />
            <div className="flex-1 space-y-1.5">
              <SkeletonLine width="60%" height="14px" />
              <SkeletonLine width="40%" height="10px" />
            </div>
            <SkeletonLine width="60px" height="16px" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WalletPageSkeleton() {
  return (
    <div className="min-h-screen page-shell pb-20">
      <WalletBalanceSkeleton />
      <WalletTransactionsSkeleton />
    </div>
  );
}
