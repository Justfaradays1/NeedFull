import * as React from "react"

export const Skeleton = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={`skeleton ${className}`} style={style} />
);

export function SkeletonLine({ width = '100%', height = '14px', className = '' }: { width?: string; height?: string; className?: string }) {
  return <Skeleton className={`rounded-md ${className}`} style={{ width, height }} />;
}

export function SkeletonCircle({ size = '40px', className = '' }: { size?: string; className?: string }) {
  return <Skeleton className={`rounded-full ${className}`} style={{ width: size, height: size }} />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-card-border bg-surface p-4 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <SkeletonLine width="60%" height="16px" />
          <SkeletonLine width="40%" height="12px" />
          <SkeletonLine width="80%" height="12px" />
        </div>
        <SkeletonCircle size="36px" />
      </div>
    </div>
  );
}

export function SkeletonAvatarRow({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <SkeletonCircle size="40px" />
      <div className="space-y-2">
        <SkeletonLine width="120px" height="14px" />
        {subtitle && <SkeletonLine width="80px" height="10px" />}
      </div>
    </div>
  );
}

export function SkeletonImage({ className = '' }: { className?: string }) {
  return <Skeleton className={`w-full ${className}`} style={{ aspectRatio: '16/9' }} />;
}

export function SkeletonStatCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-card-border bg-surface p-4 ${className}`}>
      <div className="space-y-2">
        <SkeletonLine width="60%" height="12px" />
        <SkeletonLine width="40%" height="28px" />
        <SkeletonLine width="50%" height="10px" />
      </div>
    </div>
  );
}

export function SkeletonButton({ width = '100%', height = '44px' }: { width?: string; height?: string }) {
  return <Skeleton className="rounded-xl" style={{ width, height }} />;
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonLine key={j} width={j === 0 ? '30%' : `${100 / cols}%`} height="14px" />
          ))}
        </div>
      ))}
    </div>
  );
}
