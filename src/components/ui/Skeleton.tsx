interface SkeletonProps {
  className?: string
}

/**
 * Skeleton loading placeholder using shimmer animation.
 * Auto-adapts to dark mode via CSS variables.
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-md bg-neutral-100 animate-pulse-skeleton ${className}`}
      aria-hidden="true"
    />
  )
}
