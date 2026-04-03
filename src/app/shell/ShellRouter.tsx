import { useEffect, useState } from 'react'
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

  return isDesktop ? <DesktopShell /> : <MobileShell />
}
