import React from 'react'

interface BadgeProps {
  variant?: 'info' | 'warning' | 'danger' | 'success'
  children: React.ReactNode
}

export function Badge({ variant = 'info', children }: BadgeProps) {
  const variants = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-800',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
