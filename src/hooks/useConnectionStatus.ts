import { useEffect, useState } from 'react'

function getInitialOnlineState() {
  if (typeof navigator === 'undefined') {
    return true
  }

  return navigator.onLine
}

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(getInitialOnlineState)
  const [lastChangeAt, setLastChangeAt] = useState(() => Date.now())

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleOnline = () => {
      setIsOnline(true)
      setLastChangeAt(Date.now())
    }

    const handleOffline = () => {
      setIsOnline(false)
      setLastChangeAt(Date.now())
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, lastChangeAt }
}
