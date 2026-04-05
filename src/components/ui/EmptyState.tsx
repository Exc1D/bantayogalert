import { type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  'aria-live'?: 'polite' | 'assertive'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  'aria-live': ariaLive,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 px-4 text-center"
      role="status"
      aria-live={ariaLive}
    >
      <Icon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" aria-hidden="true" />
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
