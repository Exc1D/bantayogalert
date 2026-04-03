import { type LucideIcon } from 'lucide-react'

export interface NavItemProps {
  icon: LucideIcon
  label: string
  isActive?: boolean
  onClick: () => void
  badge?: number
  variant: 'rail' | 'tab'
}

/**
 * Reusable nav item for both desktop rail and mobile bottom tabs.
 */
export function NavItem({ icon: Icon, label, isActive = false, onClick, badge, variant }: NavItemProps) {
  const isRail = variant === 'rail'

  if (isRail) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`
          relative flex flex-col items-center justify-center gap-0.5 cursor-pointer
          transition-colors rounded-lg w-full
          ${isActive
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-600'
            : 'text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border-l-2 border-transparent'
          }
        `}
        style={{ minHeight: '56px' }}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className="relative">
          <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </div>
        <span className="text-[10px] leading-tight">{label}</span>
      </button>
    )
  }

  // Tab variant
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-0.5 cursor-pointer flex-1
        transition-colors
        ${isActive
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }
      `}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative">
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] leading-tight">{label}</span>
    </button>
  )
}
