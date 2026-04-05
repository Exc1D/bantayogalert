import { Outlet } from 'react-router-dom'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { DesktopShell } from './DesktopShell'
import { MobileShell } from './MobileShell'
import { TabletShell } from './TabletShell'

export function ShellRouter() {
  const { isTablet, isDesktop } = useBreakpoint()

  return isDesktop ? (
    <DesktopShell>
      <Outlet />
    </DesktopShell>
  ) : isTablet ? (
    <TabletShell>
      <Outlet />
    </TabletShell>
  ) : (
    <MobileShell>
      <Outlet />
    </MobileShell>
  )
}
