import { Card } from '../common/Card'
import { Badge } from '../common/Badge'

interface AlertCardProps {
  id: string
  title: string
  message: string
  severity?: 'info' | 'warning' | 'danger'
  municipality?: string
  createdAt: string
  onDismiss?: (id: string) => void
}

export function AlertCard({ id, title, message, severity = 'info', municipality, createdAt, onDismiss }: AlertCardProps) {
  const severityEmoji = {
    info: 'ℹ️',
    warning: '⚠️',
    danger: '🚨',
  }[severity]

  const badgeVariant =
    severity === 'danger' ? 'danger' : severity === 'warning' ? 'warning' : 'info'

  return (
    <Card className="border-l-4 border-l-primary-400">
      <div className="flex gap-3">
        <div className="flex-shrink-0 text-xl">{severityEmoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm">{title}</h3>
            <Badge variant={badgeVariant}>{severity}</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{message}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {municipality ?? 'All municipalities'} • {createdAt}
            </span>
            {onDismiss && (
              <button
                onClick={() => onDismiss(id)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

/** Placeholder alert list — replaces with real data in Phase 5 (notifications) */
export function AlertList() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">No active alerts. Alerts will appear here when issued by admins.</p>
      <div className="space-y-2">
        <AlertCard
          id="demo"
          title="Sample Alert"
          message="This is a placeholder alert card. Real alerts will be loaded from Firestore in Phase 5."
          severity="warning"
          municipality="Daet"
          createdAt="Just now"
        />
      </div>
    </div>
  )
}
