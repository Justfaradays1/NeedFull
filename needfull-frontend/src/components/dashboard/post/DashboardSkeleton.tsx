"use client";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className ?? ""}`} />;
}

// WHAT: Home loading skeleton mirroring the redesigned, compact dashboard:
//       wallet → quick actions → categories → post CTA → active tasks → activity
export function DashboardSkeleton() {
  return (
    <div className="page-column">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:gap-5">
        <SkeletonBlock className="h-36 w-full" />
        <SkeletonBlock className="h-20 w-full" />
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="h-24 w-full" />
        <SkeletonBlock className="h-16 w-full" />
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="h-24 w-full" />
      </div>
    </div>
  );
}