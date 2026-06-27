export default function WalletLoading() {
  return (
    <div className="min-h-screen bg-gray-50 safe-all">
      {/* Gradient brand header skeleton */}
      <div className="bg-gradient-to-b from-brand-dark to-brand px-4 pb-8 pt-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-16 skeleton rounded" />
          <div className="h-9 w-9 skeleton rounded-full" />
        </div>

        {/* Balance skeleton */}
        <div className="space-y-3 py-4">
          <div className="h-3 w-24 skeleton rounded" />
          <div className="h-10 w-48 skeleton rounded" />
          <div className="h-3 w-36 skeleton rounded" />
        </div>

        {/* Action buttons skeleton */}
        <div className="mt-5 flex gap-3">
          <div className="flex-1 h-12 skeleton rounded-lg" />
          <div className="flex-1 h-12 skeleton rounded-lg" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="mx-4 mt-4 sm:mx-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 skeleton rounded-2xl" />
          <div className="h-24 skeleton rounded-2xl" />
        </div>
      </div>

      {/* Transaction list skeleton */}
      <div className="mx-4 mt-4 pb-8 sm:mx-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="h-4 w-40 skeleton rounded mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-4 border-t border-gray-100 first:border-t-0">
              <div className="h-9 w-9 skeleton rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 skeleton rounded" />
                <div className="h-3 w-20 skeleton rounded" />
              </div>
              <div className="h-4 w-16 skeleton rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
