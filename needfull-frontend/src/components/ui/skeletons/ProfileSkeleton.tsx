import { Skeleton, SkeletonLine, SkeletonCircle, SkeletonCard, SkeletonStatCard } from '../skeleton';

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen page-shell">
      <div className="px-4 py-4 space-y-5">
        <div className="flex flex-col items-center space-y-3">
          <SkeletonCircle size="80px" />
          <SkeletonLine width="140px" height="20px" />
          <SkeletonLine width="200px" height="14px" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <div className="space-y-3">
          <SkeletonLine width="100px" height="16px" />
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 px-4 py-4">
      <SkeletonLine width="120px" height="22px" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-card-border bg-surface p-4 space-y-3">
          <SkeletonLine width="80px" height="16px" />
          <SkeletonLine width="100%" height="44px" />
          <SkeletonLine width="60%" height="44px" />
        </div>
      ))}
    </div>
  );
}
