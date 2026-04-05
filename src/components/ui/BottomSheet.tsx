import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type SheetState = 'peek' | 'half' | 'full'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  defaultState?: SheetState
  children: ReactNode
}

const HEIGHT_MAP: Record<SheetState, string> = {
  peek: '30vh',
  half: '60vh',
  full: 'calc(100vh - 1rem)',
}

const SNAP_ORDER: SheetState[] = ['peek', 'half', 'full']

export function BottomSheet({
  isOpen,
  onClose,
  defaultState = 'peek',
  children,
}: BottomSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>(defaultState)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const dragStartY = useRef(0)
  const dragCurrentY = useRef(0)
  const isDragging = useRef(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setSheetState(defaultState)
    }
  }, [isOpen, defaultState])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const currentIndex = SNAP_ORDER.indexOf(sheetState)

  const snapToNearest = (deltaY: number) => {
    if (currentIndex < 0) return
    let newIndex = currentIndex
    if (deltaY < -80) {
      newIndex = Math.max(0, currentIndex - 1)
    } else if (deltaY > 80) {
      newIndex = Math.min(SNAP_ORDER.length - 1, currentIndex + 1)
    }
    if (newIndex !== currentIndex) {
      setIsTransitioning(true)
      setSheetState(SNAP_ORDER[newIndex]!)
      setTimeout(() => setIsTransitioning(false), 250)
    }
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const scrollEl = scrollRef.current
    const isAtTop = !scrollEl || scrollEl.scrollTop <= 0
    if (isAtTop || (e.target as HTMLElement).hasAttribute('data-sheet-handle')) {
      dragStartY.current = e.touches[0]!.clientY
      dragCurrentY.current = dragStartY.current
      isDragging.current = true
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    dragCurrentY.current = e.touches[0]!.clientY
    const deltaY = dragStartY.current - dragCurrentY.current

    const sheet = sheetRef.current
    if (!sheet) return

    const vhValue = window.innerHeight
    const currentPx = HEIGHT_MAP[sheetState].includes('calc')
      ? 0.6 * vhValue // approximate full = 80vh for calc version
      : (parseFloat(HEIGHT_MAP[sheetState]) / 100) * vhValue
    const newPx = currentPx - deltaY
    const newVh = (newPx / vhValue) * 100

    sheet.style.height = `${Math.max(10, Math.min(100, newVh))}vh`
    sheet.style.transition = 'none'
  }

  const handleTouchEnd = () => {
    if (!isDragging.current) return
    const sheet = sheetRef.current
    const deltaY = dragStartY.current - dragCurrentY.current

    if (sheet) {
      sheet.style.transition = ''
      sheet.style.height = ''
    }
    snapToNearest(deltaY)
    isDragging.current = false
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        data-testid="bottom-sheet-backdrop"
        className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-200"
        style={{ opacity: sheetState === 'peek' ? 0.4 : 0.7 }}
        onClick={() => {
          if (sheetState === 'peek') {
            onClose()
          } else {
            setSheetState('peek')
          }
        }}
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl z-50"
        style={{
          height: HEIGHT_MAP[sheetState],
          transition: isTransitioning ? 'height 250ms ease-out' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          data-sheet-handle
        >
          <div className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Content */}
        <div ref={scrollRef} className="h-full overflow-y-auto pb-8 px-4">
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}
