import { SkeletonLine, SkeletonCircle } from '../skeleton';

export function ChatDetailSkeleton() {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-card-border bg-surface px-2 py-2 shadow-sm">
        <div className="h-9 w-9 rounded-full skeleton" />
        <div className="flex-1 space-y-1">
          <SkeletonLine width="120px" height="14px" />
          <SkeletonLine width="80px" height="10px" />
        </div>
      </div>
      {/* Messages area */}
      <div className="flex-1 space-y-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => {
          const isRight = i % 2 === 0;
          return (
            <div key={i} className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
              <div className={`space-y-1.5 ${isRight ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className="flex items-end gap-1.5">
                  {isRight && <SkeletonLine width="30px" height="10px" />}
                  <div className={`rounded-2xl px-4 py-2.5 skeleton`}>
                    <SkeletonLine width={isRight ? "120px" : "160px"} height="14px" />
                    <SkeletonLine width={isRight ? "90px" : "70px"} height="10px" />
                  </div>
                  {!isRight && <SkeletonLine width="30px" height="10px" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Input area */}
      <div className="border-t border-card-border bg-surface p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 rounded-xl skeleton" />
          <div className="h-10 w-10 rounded-xl skeleton" />
        </div>
      </div>
    </div>
  );
}
