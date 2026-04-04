export function SkeletonLine({ width = 'w-full' }: { width?: string }) {
  return <div className={`h-4 rounded ${width} skeleton`} />
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <SkeletonLine width="w-1/3" />
      <SkeletonLine width="w-full" />
      <SkeletonLine width="w-2/3" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="p-4 space-y-4">
        <SkeletonLine width="w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="w-8 h-8 rounded-full skeleton shrink-0" />
          <SkeletonLine width="w-1/4" />
          <SkeletonLine width="w-1/3" />
          <SkeletonLine width="w-1/6" />
          <SkeletonLine width="w-1/6" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="stat-card stat-card-accent">
          <div className="space-y-3">
            <SkeletonLine width="w-1/3" />
            <div className="h-8 w-1/2 skeleton rounded" />
            <SkeletonLine width="w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LoadingSkeleton({
  type = 'card',
}: {
  type?: 'card' | 'table' | 'line' | 'stats'
}) {
  if (type === 'table') return <SkeletonTable />
  if (type === 'line') return <SkeletonLine />
  if (type === 'stats') return <SkeletonStats />
  return <SkeletonCard />
}
