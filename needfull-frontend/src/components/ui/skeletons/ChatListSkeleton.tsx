import { SkeletonLine, SkeletonCircle } from '../skeleton';

export function ChatListSkeleton() {
  return (
    <div className="space-y-1 px-4 pb-8 pt-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <SkeletonCircle size="44px" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="60%" height="14px" />
            <SkeletonLine width="85%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}
