import { SkeletonLine, SkeletonCircle } from '../skeleton';

export function PurchaseDetailSkeleton() {
  return (
    <div className="flex min-h-screen flex-col page-shell">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-8 w-8 rounded-full skeleton" />
        <div className="flex-1 space-y-1.5">
          <SkeletonLine width="70%" height="16px" />
          <SkeletonLine width="40%" height="12px" />
        </div>
      </div>
      {/* Timeline skeleton */}
      <div className="px-4 py-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <SkeletonCircle size="24px" />
            <div className="flex-1 space-y-1">
              <SkeletonLine width="50%" height="13px" />
              <SkeletonLine width="30%" height="11px" />
            </div>
          </div>
        ))}
      </div>
      {/* Detail cards */}
      <div className="px-4 py-3 space-y-4">
        <div className="rounded-xl border border-card-border bg-surface p-4 space-y-2">
          <SkeletonLine width="90%" height="14px" />
          <SkeletonLine width="75%" height="14px" />
          <SkeletonLine width="60%" height="14px" />
        </div>
        <div className="rounded-xl border border-card-border bg-surface p-4 space-y-2">
          <SkeletonLine width="80%" height="14px" />
          <SkeletonLine width="50%" height="12px" />
        </div>
      </div>
    </div>
  );
}
