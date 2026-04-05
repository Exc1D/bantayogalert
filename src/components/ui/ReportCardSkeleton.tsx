import { Skeleton } from './Skeleton'

interface ReportCardSkeletonProps {
  count?: number
}

export function ReportCardSkeleton({ count = 4 }: ReportCardSkeletonProps) {
  return (
    <div className="divide-y divide-neutral-100">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 h-[72px] px-3 py-2">
          <div className="flex flex-col items-center gap-0.5 w-8 flex-shrink-0">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
