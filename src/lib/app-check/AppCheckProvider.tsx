import {
  CustomProvider,
  ReCaptchaEnterpriseProvider,
  initializeAppCheck,
} from 'firebase/app-check'
import React, { useEffect, useState } from 'react'
import { firebaseApp, firebaseRuntime } from '../firebase/config'

function createAuditProvider() {
  return new CustomProvider({
    getToken: async () => {
      if (import.meta.env.DEV) {
        console.debug('[AppCheck Audit] Generating placeholder token')
      }

      return {
        token: 'placeholder-audit-token-' + Date.now(),
        expireTimeMillis: Date.now() + 3600000,
      }
    },
  })
}

export function AppCheckProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized || import.meta.env.MODE === 'test') {
      setInitialized(true)
      return
    }

    try {
      const appCheckMode = firebaseRuntime.appCheckMode
      const useProductionProvider =
        !firebaseRuntime.useEmulator &&
        import.meta.env.PROD &&
        appCheckMode === 'enforce' &&
        firebaseRuntime.appCheckSiteKey

      if (
        firebaseRuntime.appCheckDebugToken &&
        (firebaseRuntime.useEmulator || !import.meta.env.PROD)
      ) {
        ;(
          globalThis as typeof globalThis & {
            FIREBASE_APPCHECK_DEBUG_TOKEN?: string
          }
        ).FIREBASE_APPCHECK_DEBUG_TOKEN = firebaseRuntime.appCheckDebugToken
      }

      const provider = useProductionProvider
        ? new ReCaptchaEnterpriseProvider(firebaseRuntime.appCheckSiteKey)
        : createAuditProvider()

      initializeAppCheck(firebaseApp, {
        provider,
        isTokenAutoRefreshEnabled: true,
      })

      if (import.meta.env.DEV) {
        console.debug(`[AppCheck] Initialized in ${appCheckMode} mode`)
      }

      setInitialized(true)
    } catch (error) {
      console.warn('[AppCheck] Initialization failed, continuing without App Check:', error)
      setInitialized(true)
    }
  }, [initialized])

  return <>{children}</>
}
