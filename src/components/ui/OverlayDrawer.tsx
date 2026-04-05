import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface OverlayDrawerProps {
  isOpen: boolean
  onClose: () => void
  placement?: 'bottom' | 'right'
  children: ReactNode
}

export function OverlayDrawer({
  isOpen,
  onClose,
  placement = 'right',
  children,
}: OverlayDrawerProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const isRight = placement === 'right'

  const animationClass = isRight
    ? 'translate-x-0'
    : 'translate-y-0'
  const enterClass = isRight
    ? 'translate-x-full'
    : 'translate-y-full'

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/40 z-30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed z-40 bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-200 ease-out ${animationClass}`}
        style={{
          ...(isRight
            ? { top: 0, right: 0, height: '100%', width: '360px', maxWidth: '100%' }
            : { bottom: 0, left: 0, right: 0, maxHeight: '80vh', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }
          ),
        }}
        data-initial-state={enterClass}
      >
        {children}
      </div>
    </>,
    document.body
  )
}
