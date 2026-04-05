import { Bell, BellOff, RefreshCw } from 'lucide-react'
import { AlertCard } from './AlertCard'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import type { Announcement } from '@/types/announcement'
import { EmptyState } from '@/components/ui/EmptyState'

interface AlertsFeedProps {
  onAlertClick?: (announcement: Announcement) => void
}

export function AlertsFeed({ onAlertClick }: AlertsFeedProps) {
  const {
    data: announcements = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useAnnouncements()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
        <BellOff className="h-8 w-8 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">
          Unable to load alerts.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (announcements.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Bell}
          title="No alerts yet"
          description="Official advisories and emergency alerts will appear here after they are published."
          aria-live="polite"
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      {isFetching ? (
        <div className="flex items-center justify-center gap-2 py-1 text-xs text-gray-400">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Updating alerts…
        </div>
      ) : null}
      {announcements.map((announcement) => (
        <AlertCard
          key={announcement.id}
          announcement={announcement}
          onClick={onAlertClick}
        />
      ))}
    </div>
  )
}
