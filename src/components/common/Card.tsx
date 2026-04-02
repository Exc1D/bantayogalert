import { ReactNode, MouseEventHandler } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: MouseEventHandler<HTMLDivElement>
}
export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
