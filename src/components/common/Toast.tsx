import { useState, useEffect } from 'react'
interface ToastProps {
  message: string
  type?: 'info' | 'success' | 'error'
  onDismiss?: () => void
}
export function Toast({ message, type = 'info', onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDismiss?.() }, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])
  if (!visible) return null
  const colors: Record<string, string> = { info: 'bg-blue-500', success: 'bg-green-500', error: 'bg-red-500' }
  return (
    <div className={`fixed bottom-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg z-50`}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
