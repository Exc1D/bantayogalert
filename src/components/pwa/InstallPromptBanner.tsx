import { useState } from 'react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export function InstallPromptBanner() {
  const { isInstallAvailable, promptInstall, dismissInstallPrompt } =
    useInstallPrompt()
  const [isPrompting, setIsPrompting] = useState(false)

  if (!isInstallAvailable) {
    return null
  }

  return (
    <div className="pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-[1.5rem] border border-slate-800 bg-slate-950/95 px-4 py-3 text-sm text-slate-100 shadow-2xl shadow-slate-950/40">
      <div>
        <p className="font-semibold text-white">Install Bantayog Alert</p>
        <p className="mt-1 text-xs text-slate-300">
          Save the app to your device for faster access during emergencies.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            dismissInstallPrompt()
          }}
          className="rounded-full border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          Later
        </button>
        <button
          type="button"
          onClick={() => {
            setIsPrompting(true)
            void promptInstall().finally(() => {
              setIsPrompting(false)
            })
          }}
          className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-400"
        >
          {isPrompting ? 'Installing...' : 'Install'}
        </button>
      </div>
    </div>
  )
}
