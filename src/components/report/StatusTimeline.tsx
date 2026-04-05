import { ReportStatus, type ActivityLogEntry } from '@/types/report'

import { Skeleton } from '@/components/ui/Skeleton'

/**
 * Citizen-facing plain language labels for each status.
 * Maps technical workflow states to reassuring citizen language.
 */
const CITIZEN_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.Submitted]: 'Report Received',
  [ReportStatus.UnderReview]: 'Reviewing Your Report',
  [ReportStatus.Verified]: 'Verified — Help Is On the Way',
  [ReportStatus.Rejected]: 'Report Closed',
  [ReportStatus.Dispatched]: 'Responders Dispatched',
  [ReportStatus.Acknowledged]: 'Responders Acknowledged',
  [ReportStatus.InProgress]: 'Responders En Route',
  [ReportStatus.Resolved]: 'Situation Resolved',
}

/**
 * Sequential citizen-facing timeline steps.
 * Each step is a ReportStatus in logical order.
 */
const TIMELINE_STEPS: ReportStatus[] = [
  ReportStatus.Submitted,
  ReportStatus.UnderReview,
  ReportStatus.Verified,
  ReportStatus.Dispatched,
  ReportStatus.Resolved,
]

/**
 * Next-step hint text for ghost future steps.
 */
const FUTURE_HINTS: Partial<Record<ReportStatus, string>> = {
  [ReportStatus.Verified]: 'Help is being dispatched to the area',
  [ReportStatus.Dispatched]: 'Responders will acknowledge once on scene',
  [ReportStatus.Acknowledged]: 'Team is working to resolve the situation',
}

interface StatusTimelineProps {
  currentStatus: ReportStatus
  activityLog?: ActivityLogEntry[]
}

export function StatusTimeline({ currentStatus, activityLog = [] }: StatusTimelineProps) {
  const currentStepIndex = TIMELINE_STEPS.indexOf(currentStatus)
  const effectiveIndex = currentStepIndex >= 0 ? currentStepIndex : 0

  return (
    <div className="relative py-4">
      {/* Vertical connecting line */}
      <div
        className="absolute left-5 top-2 bottom-2 w-0.5 bg-neutral-200 dark:bg-neutral-700"
        aria-hidden="true"
      />

      {/* Timeline steps */}
      <ul className="space-y-4" role="list" aria-label="Report status timeline">
        {TIMELINE_STEPS.map((step, index) => {
          const isPast = index < effectiveIndex
          const isCurrent = index === effectiveIndex
          const isFuture = index > effectiveIndex
          const hint = FUTURE_HINTS[step]

          return (
            <li
              key={step}
              className={`relative flex gap-4 ${
                isFuture ? 'opacity-50' : ''
              } ${index % 2 === 0 ? '' : 'flex-row-reverse text-right'}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Dot */}
              <div className="relative z-10 flex-shrink-0 w-10 flex items-center justify-center">
                {isCurrent ? (
                  <span
                    className="w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-brand/20 animate-pulse"
                    aria-hidden="true"
                  />
                ) : isPast ? (
                  <span
                    className="w-3.5 h-3.5 rounded-full bg-status-verified"
                    aria-hidden="true"
                  />
                ) : (
                  <span
                    className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-600"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <p className={`text-sm font-medium ${
                  isCurrent
                    ? 'text-neutral-900 dark:text-neutral-100'
                    : isPast
                      ? 'text-status-verified'
                      : 'text-neutral-400'
                }`}>
                  {CITIZEN_LABELS[step]}
                </p>
                {hint && isFuture && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {hint}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {/* Activity Log */}
      {activityLog.length > 0 && (
        <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            Activity
          </h4>
          <ul className="space-y-2" role="list">
            {activityLog.slice(-5).reverse().map((entry, i) => (
              <li key={i} className="text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-medium">{entry.action}</span>
                {entry.performedAt && (
                  <span className="text-neutral-400 ml-2">
                    {formatRelativeTime(entry.performedAt)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function StatusTimelineSkeleton() {
  return (
    <div className="space-y-4 py-4" aria-label="Loading status timeline">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
