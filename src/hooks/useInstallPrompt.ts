import { useEffect, useState } from 'react'

interface BeforeInstallPromptChoice {
  outcome: 'accepted' | 'dismissed'
  platform: string
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<BeforeInstallPromptChoice>
}

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
      setIsDismissed(false)
    }

    const handleAppInstalled = () => {
      setPromptEvent(null)
      setIsDismissed(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function promptInstall() {
    if (!promptEvent) {
      return null
    }

    await promptEvent.prompt()
    const result = await promptEvent.userChoice

    if (result.outcome === 'accepted') {
      setPromptEvent(null)
    }

    return result
  }

  function dismissInstallPrompt() {
    setIsDismissed(true)
  }

  return {
    isInstallAvailable: Boolean(promptEvent) && !isDismissed,
    promptInstall,
    dismissInstallPrompt,
  }
}
