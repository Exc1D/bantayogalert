import { useConnectionStatus } from '@/hooks/useConnectionStatus'

export function ConnectionStatusBanner() {
  const { isOnline } = useConnectionStatus()

  if (isOnline) {
    return null
  }

  return (
    <div className="pointer-events-auto w-full max-w-3xl rounded-full border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-lg shadow-amber-200/40">
      Offline. Bantayog Alert will retry queued submissions when connectivity
      returns.
    </div>
  )
}
