export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-gray-50 safe-all">
      {/* Top nav skeleton */}
      <div className="glass-dark px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 skeleton rounded-lg" />
            <div className="h-5 w-24 skeleton rounded" />
          </div>
          <div className="h-9 w-24 skeleton rounded-full" />
        </div>
      </div>

      <div className="px-4 pt-4 pb-24 space-y-4">
        {/* Greeting card skeleton */}
        <div className="rounded-2xl p-5 space-y-2">
          <div className="h-7 w-48 skeleton rounded" />
          <div className="h-4 w-36 skeleton rounded" />
        </div>

        {/* Quick actions skeleton */}
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-1 h-20 skeleton rounded-xl" />
          ))}
        </div>

        {/* Trending tasks skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-32 skeleton rounded" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-[200px] shrink-0 h-28 skeleton rounded-xl" />
            ))}
          </div>
        </div>

        {/* Popular categories skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-40 skeleton rounded" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 w-24 skeleton rounded-xl" />
            ))}
          </div>
        </div>

        {/* Campus activity skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-36 skeleton rounded" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 skeleton rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
