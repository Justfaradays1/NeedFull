import { Skeleton, SkeletonLine, SkeletonCircle, SkeletonImage, SkeletonButton } from '../skeleton';

export function TaskDetailSkeleton() {
  return (
    <div className="min-h-screen page-shell">
      <div className="bg-surface px-4 py-3 shadow-sm border-b border-card-border">
        <div className="flex items-center gap-3">
          <Skeleton className="rounded-lg" style={{ width: 36, height: 36 }} />
          <SkeletonLine width="180px" height="18px" />
        </div>
      </div>
      <div className="px-4 py-4">
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm border border-card-border">
          <SkeletonImage />
          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <Skeleton className="rounded-full" style={{ width: 70, height: 24 }} />
              <Skeleton className="rounded-full" style={{ width: 60, height: 24 }} />
            </div>
            <SkeletonLine width="100%" height="14px" />
            <SkeletonLine width="90%" height="14px" />
            <SkeletonLine width="70%" height="14px" />
            <div className="space-y-2">
              <SkeletonLine width="120px" height="14px" />
              <SkeletonLine width="100px" height="14px" />
              <SkeletonLine width="140px" height="14px" />
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-gray-100 dark:bg-gray-800 p-3">
              <SkeletonCircle size="40px" />
              <div className="space-y-2">
                <SkeletonLine width="100px" height="14px" />
                <SkeletonLine width="80px" height="12px" />
              </div>
            </div>
            <div className="space-y-2">
              <SkeletonButton />
              <SkeletonButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedDetailSkeleton() {
  return (
    <div className="min-h-screen page-shell">
      <div className="glass-dark px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="rounded-lg" style={{ width: 36, height: 36 }} />
          <SkeletonLine width="180px" height="18px" />
        </div>
      </div>
      <div className="px-4 py-4">
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <SkeletonImage />
          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <Skeleton className="rounded-full" style={{ width: 70, height: 24 }} />
              <Skeleton className="rounded-full" style={{ width: 60, height: 24 }} />
            </div>
            <SkeletonLine width="100%" height="14px" />
            <SkeletonLine width="90%" height="14px" />
            <SkeletonLine width="70%" height="14px" />
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
              <SkeletonCircle size="40px" />
              <div className="space-y-2">
                <SkeletonLine width="100px" height="14px" />
                <SkeletonLine width="60px" height="12px" />
              </div>
            </div>
            <Skeleton className="rounded-2xl" style={{ width: '100%', height: 200 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
