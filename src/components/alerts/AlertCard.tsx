import { AlertCircle, AlertTriangle, Bell, CheckCircle, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getMunicipality } from '@/lib/geo/municipality'
import type {
  Announcement,
  AnnouncementSeverity,
  AnnouncementType,
} from '@/types/announcement'

const SEVERITY_STYLES: Record<
  AnnouncementSeverity,
  { badge: string; accent: string }
> = {
  info: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    accent: 'bg-blue-500',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    accent: 'bg-amber-500',
  },
  critical: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    accent: 'bg-red-600',
  },
}

const TYPE_ICONS: Record<AnnouncementType, typeof Bell> = {
  alert: AlertTriangle,
  advisory: AlertCircle,
  update: Info,
  all_clear: CheckCircle,
}

function formatRelativeTime(isoDate?: string): string {
  if (!isoDate) {
    return 'recently'
  }

  const diffMs = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.max(1, Math.floor(diffMs / 60000))

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days}d ago`
  }

  return new Date(isoDate).toLocaleDateString()
}

function getScopeLabel(announcement: Announcement): string {
  if (announcement.targetScope.type === 'province') {
    return 'Province-wide'
  }

  if (announcement.targetScope.type === 'municipality') {
    const municipality = getMunicipality(
      announcement.targetScope.municipalityCodes[0]
    )
    return municipality?.name ?? announcement.targetScope.municipalityCodes[0]
  }

  return `${announcement.targetScope.municipalityCodes.length} municipalities`
}

interface AlertCardProps {
  announcement: Announcement
  onClick?: (announcement: Announcement) => void
  href?: string
}

function AlertCardBody({ announcement }: { announcement: Announcement }) {
  const Icon = TYPE_ICONS[announcement.type]
  const severity = SEVERITY_STYLES[announcement.severity]
  const relativeTime = formatRelativeTime(
    announcement.publishedAt ?? announcement.createdAt
  )

  return (
    <div className="flex items-start gap-3">
      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${severity.accent}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Icon className="h-4 w-4" />
          <span
            className={`rounded-full border px-2 py-0.5 font-medium ${severity.badge}`}
          >
            {announcement.severity}
          </span>
          <span className="capitalize">{announcement.type.replace('_', ' ')}</span>
        </div>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          {announcement.title}
        </h3>
        <p className="mt-1 text-sm text-gray-600">{announcement.body}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{getScopeLabel(announcement)}</span>
          <span>{relativeTime}</span>
        </div>
      </div>
    </div>
  )
}

export function AlertCard({
  announcement,
  onClick,
  href,
}: AlertCardProps) {
  const className =
    'block w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50'

  if (href) {
    return (
      <Link to={href} className={className}>
        <AlertCardBody announcement={announcement} />
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onClick?.(announcement)}
      className={className}
    >
      <AlertCardBody announcement={announcement} />
    </button>
  )
}
