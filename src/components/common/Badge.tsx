interface BadgeProps {
  variant?: 'info' | 'warning' | 'danger' | 'success' | 'gray'
  children: React.ReactNode
  className?: string
}
export function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  const variants: Record<string, string> = {
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    success: 'bg-green-100 text-green-700',
    gray: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
