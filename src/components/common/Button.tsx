interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}
export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'text-gray-600 hover:bg-gray-100',
  }
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2', lg: 'px-6 py-3 text-lg' }
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
