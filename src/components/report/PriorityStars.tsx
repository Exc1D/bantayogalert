import { Star } from 'lucide-react'

export interface PriorityStarsProps {
  value?: 1 | 2 | 3 | 4 | 5
  onChange?: (priority: 1 | 2 | 3 | 4 | 5) => void
  readonly?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function PriorityStars({
  value,
  onChange,
  readonly = false,
  size = 'sm',
  className = '',
}: PriorityStarsProps) {
  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const priority = value ?? 0

  return (
    <div className={`flex items-center gap-0.5 ${className}`} role={readonly ? undefined : 'group'} aria-label="Report priority">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= priority
        return (
          <button
            key={n}
            type="button"
            disabled={readonly}
            onClick={() => {
              if (!readonly && onChange && n !== priority) {
                onChange(n as 1 | 2 | 3 | 4 | 5)
              }
            }}
            className={`
              ${starSize}
              transition-colors
              ${readonly ? 'cursor-default' : 'cursor-pointer'}
              ${!readonly && onChange ? 'hover:scale-110' : ''}
            `}
            aria-label={`Priority ${n}${n <= priority ? ' (filled)' : ' (empty)'}`}
          >
            <Star
              className={`
                ${starSize}
                ${filled ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-gray-300'}
                ${!readonly && onChange && !filled ? 'hover:fill-yellow-200 hover:text-yellow-400' : ''}
                transition-colors
              `}
              strokeWidth={1.5}
            />
          </button>
        )
      })}
    </div>
  )
}
