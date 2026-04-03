import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ReportDetailPanel } from './ReportDetailPanel'
import { useUIStore } from '@/stores/uiStore'

export function ReportDetailSheet() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const setSelectedReportId = useUIStore((s) => s.setSelectedReportId)
  const setActivePanel = useUIStore((s) => s.setActivePanel)

  const [, setSheetOpen] = useState(false)
  const [dragY, setDragY] = useState(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const startDragRef = useRef(0)

  // Open sheet on mount
  useEffect(() => {
    if (id) {
      setSelectedReportId(id)
      setActivePanel('report-detail')
      setSheetOpen(true)
    }
  }, [id, setSelectedReportId, setActivePanel])

  const handleClose = () => {
    setSheetOpen(false)
    setSelectedReportId(null)
    setActivePanel(null)
    navigate(-1)
  }

  // Drag gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    startYRef.current = touch.clientY
    startDragRef.current = dragY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    const delta = touch.clientY - startYRef.current
    const newDrag = Math.max(0, startDragRef.current + delta)
    setDragY(newDrag)
  }

  const handleTouchEnd = () => {
    if (dragY > 100) {
      handleClose()
    } else {
      setDragY(0)
    }
  }

  // Determine sheet height (40% or 90% based on drag)
  const sheetHeight = dragY > 0 ? Math.max(40, 90 - dragY / 5) : 90

  if (!id) return null

  return (
    <>
      {/* Scrim overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        className="fixed left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl overflow-hidden"
        style={{
          bottom: 0,
          height: `${sheetHeight}%`,
          transition: dragY === 0 ? 'height 300ms ease-out' : 'none',
          maxHeight: '90vh',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Report detail"
      >
        {/* Drag handle */}
        <div
          className="flex justify-center py-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <div className="h-full overflow-hidden">
          <ReportDetailPanel reportId={id} />
        </div>
      </div>
    </>
  )
}
