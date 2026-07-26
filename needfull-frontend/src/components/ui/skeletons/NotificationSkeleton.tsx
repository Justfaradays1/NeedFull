import { Skeleton, SkeletonLine, SkeletonCircle } from '../skeleton';

export function NotificationSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <SkeletonCircle size="40px" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="70%" height="14px" />
            <SkeletonLine width="50%" height="10px" />
          </div>
        </div>
      ))}
    </div>
  );
}
