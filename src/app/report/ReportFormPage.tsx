/**
 * ReportFormPage - Viewport-aware report form page
 * Desktop: sets activePanel='report-form' to open drawer (form appears in drawer)
 * Mobile: renders full-screen ReportFormMobileWrapper
 */
import { useEffect, useState } from 'react'
import { ReportFormMobileWrapper } from './ReportFormMobileWrapper'
import { useUIStore } from '@/stores/uiStore'

export function ReportFormPage() {
  const [isMobile, setIsMobile] = useState(false)
  const { setActivePanel, setDrawerOpen } = useUIStore()

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1279px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // On desktop, set activePanel to open the drawer (form renders inside it via WorkspaceDrawer)
  useEffect(() => {
    if (!isMobile) {
      setActivePanel('report-form')
      return () => {
        setActivePanel(null)
        setDrawerOpen(false)
      }
    }
  }, [isMobile, setActivePanel, setDrawerOpen])

  // On mobile, render the full-screen modal wrapper
  if (isMobile) {
    return <ReportFormMobileWrapper />
  }

  return null
}
