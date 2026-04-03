import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, getFirestore } from 'firebase/firestore'
import { ReportDetailPanel } from './ReportDetailPanel'
import { ReportDetailOwner } from './ReportDetailOwner'
import { useUIStore } from '@/stores/uiStore'
import { useAuth } from '@/lib/auth/hooks'

export function ReportDetailSheet() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const setSelectedReportId = useUIStore((s) => s.setSelectedReportId)
  const setActivePanel = useUIStore((s) => s.setActivePanel)
  const { user } = useAuth()

  const [, setSheetOpen] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isOwner, setIsOwner] = useState(false)
  const [ownerCheckDone, setOwnerCheckDone] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const startDragRef = useRef(0)

  // Check ownership on mount
  useEffect(() => {
    if (!id || !user) {
      setOwnerCheckDone(true)
      return
    }

    const currentUid = user.uid

    async function checkOwnership() {
      try {
        const firestore = getFirestore()
        const ref = doc(firestore, 'report_private', id as string)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data()
          // Check if current user UID matches the reporterId stored in report_private
          // The reporterId field should be the user's UID
          const reporterId = data.reporterId
          setIsOwner(reporterId === currentUid)
        }
      } catch (err) {
        console.error('Error checking report ownership:', err)
        setIsOwner(false)
      } finally {
        setOwnerCheckDone(true)
      }
    }

    checkOwnership()
  }, [id, user])

  // Open sheet on mount
  useEffect(() => {
    if (id && ownerCheckDone) {
      setSelectedReportId(id)
      setActivePanel('report-detail')
      setSheetOpen(true)
    }
  }, [id, setSelectedReportId, setActivePanel, ownerCheckDone])

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

  // Show loading while checking ownership
  if (!ownerCheckDone) {
    return (
      <>
        {/* Scrim overlay */}
        <div
          className="fixed inset-0 bg-black/30 z-40"
          aria-hidden="true"
        />
        <div className="fixed left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl overflow-hidden flex items-center justify-center"
          style={{ bottom: 0, height: '40%', maxHeight: '90vh' }}
        >
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </>
    )
  }

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
          {isOwner ? (
            <ReportDetailOwner reportId={id} />
          ) : (
            <ReportDetailPanel reportId={id} />
          )}
        </div>
      </div>
    </>
  )
}
