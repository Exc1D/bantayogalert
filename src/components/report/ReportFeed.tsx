import { useEffect, useRef } from 'react'
import { useReportFeed } from '@/hooks/useReportFeed'
import { ReportFeedCard } from './ReportFeedCard'
import { useUIStore } from '@/stores/uiStore'
import { useFilterStore } from '@/stores/filterStore'

function SkeletonCard() {
  return (
    <div className="w-full px-3 py-2 border-b border-gray-100">
      <div className="flex items-center gap-3 h-[72px] animate-pulse">
        <div className="flex flex-col items-center gap-0.5 w-8 flex-shrink-0">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="w-2.5 h-2.5 bg-gray-200 rounded-full" />
        </div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="h-3 bg-gray-200 rounded w-12" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  )
}

export function ReportFeed() {
  const { pages, hasMore, isLoading, isLoadingMore, loadMore, error } = useReportFeed()
  const setSelectedReportId = useUIStore((s) => s.setSelectedReportId)
  const setActivePanel = useUIStore((s) => s.setActivePanel)
  const { type, severity, municipalityCode } = useFilterStore()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const hasActiveFilters = type !== null || severity !== null || municipalityCode !== null
  const allReports = pages.flat()

  // Setup IntersectionObserver for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [hasMore, isLoadingMore, loadMore])

  const handleCardClick = (report: { id: string }) => {
    setSelectedReportId(report.id)
    setActivePanel('report-detail')
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 text-sm">Failed to load reports</p>
          <button onClick={loadMore} className="text-blue-600 text-sm mt-1 underline">
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!isLoading && allReports.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            {hasActiveFilters ? 'No reports match your filters' : 'No verified reports yet'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => useFilterStore.getState().clearFilters()}
              className="text-blue-600 text-sm mt-1 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Skeleton on initial load */}
      {isLoading && pages.length === 0 && (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {/* Report cards */}
      {allReports.map((report) => (
        <ReportFeedCard
          key={report.id}
          report={report}
          onClick={handleCardClick}
        />
      ))}

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="p-3 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* IntersectionObserver sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* End of feed */}
      {!hasMore && allReports.length > 0 && (
        <div className="p-3 text-center text-xs text-gray-400">
          All reports loaded
        </div>
      )}
    </div>
  )
}
