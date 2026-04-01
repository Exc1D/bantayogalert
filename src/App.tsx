import { useEffect, useState } from 'react'
import { DesktopShell } from './components/layout/DesktopShell'
import { MobileShell } from './components/layout/MobileShell'
import { MapProvider } from './contexts/MapContext'
import { ModalProvider } from './contexts/ModalContext'
import { AuthProvider } from './contexts/AuthContext'
import { ReportsProvider } from './contexts/ReportsContext'

function App() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <AuthProvider>
      <MapProvider>
        <ModalProvider>
          <ReportsProvider>
            {isMobile ? <MobileShell /> : <DesktopShell />}
          </ReportsProvider>
        </ModalProvider>
      </MapProvider>
    </AuthProvider>
  )
}

export default App
