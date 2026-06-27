export default function ChatLoading() {
  return (
    <div className="min-h-screen bg-gray-50 safe-all px-4 pt-4 pb-24">
      {/* Header skeleton */}
      <div className="space-y-1 mb-6">
        <div className="h-7 w-32 skeleton rounded" />
        <div className="h-4 w-56 skeleton rounded" />
      </div>

      {/* Search bar skeleton */}
      <div className="h-12 skeleton rounded-2xl mb-6" />

      {/* Recommended tasks skeleton */}
      <div className="space-y-3 mb-6">
        <div className="h-5 w-44 skeleton rounded" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="w-[200px] shrink-0 h-28 skeleton rounded-xl" />
          ))}
        </div>
      </div>

      {/* Popular categories skeleton */}
      <div className="space-y-3 mb-6">
        <div className="h-5 w-40 skeleton rounded" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 w-24 skeleton rounded-xl" />
          ))}
        </div>
      </div>

      {/* Conversations skeleton */}
      <div className="space-y-2">
        <div className="h-5 w-32 skeleton rounded mb-3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100">
            <div className="h-12 w-12 skeleton rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 skeleton rounded" />
                <div className="h-3 w-12 skeleton rounded" />
              </div>
              <div className="h-3.5 w-48 skeleton rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
