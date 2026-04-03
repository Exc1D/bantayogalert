import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { DesktopShell } from './DesktopShell'
import { MobileShell } from './MobileShell'

export function ShellRouter() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ShellRouter is a layout component - it renders the shell UI (nav/drawer/map)
  // and an Outlet for child routes to render inside the shell
  return isDesktop ? (
    <DesktopShell>
      <Outlet />
    </DesktopShell>
  ) : (
    <MobileShell>
      <Outlet />
    </MobileShell>
  )
}
