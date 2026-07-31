"use client";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className ?? ""}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-4">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="space-y-1.5">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-8 w-32" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-10 w-10 rounded-full" />
          <SkeletonBlock className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Mobile stack skeleton */}
      <div className="flex flex-col gap-4 lg:hidden">
        <SkeletonBlock className="h-48 w-full" />
        <SkeletonBlock className="h-24 w-full" />
        <SkeletonBlock className="h-20 w-full" />
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-32 w-full" />
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-32 w-full" />
      </div>

      {/* Desktop grid skeleton */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4">
        {/* Wallet + Stats */}
        <SkeletonBlock className="col-span-8 h-52" />
        <SkeletonBlock className="col-span-4 h-52" />

        {/* Quick Actions */}
        <SkeletonBlock className="col-span-3 h-28" />
        <SkeletonBlock className="col-span-9 h-28" />

        {/* Active Tasks */}
        <SkeletonBlock className="col-span-8 h-60" />
        <SkeletonBlock className="col-span-4 h-60" />

        {/* Activity + Insights */}
        <SkeletonBlock className="col-span-8 h-44" />
        <SkeletonBlock className="col-span-4 h-44" />
      </div>
    </div>
  );
}

export function QuickStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonBlock key={i} className="h-20" />
      ))}
    </div>
  );
}
