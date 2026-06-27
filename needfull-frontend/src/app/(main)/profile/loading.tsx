export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 safe-all">
      {/* Header skeleton */}
      <div className="bg-gradient-to-b from-brand-dark to-brand px-4 pb-12 pt-4 sm:px-6">
        <div className="h-5 w-20 skeleton rounded" />
      </div>

      {/* Profile card skeleton */}
      <div className="mx-4 -mt-8 sm:mx-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="h-[72px] w-[72px] skeleton rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 skeleton rounded" />
              <div className="h-3.5 w-28 skeleton rounded" />
              <div className="h-3 w-20 skeleton rounded" />
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 skeleton rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="mx-4 mt-6 sm:mx-6">
        <div className="flex gap-2 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-24 skeleton rounded-lg" />
          ))}
        </div>

        {/* Tab content skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
