/**
 * Firebase App Check Provider
 *
 * D-51: App Check in audit mode - initialized but not enforcing.
 * In this mode, App Check is integrated but traffic is not blocked.
 * Actual enforcement comes after Phase 12 burn-in period.
 *
 * Uses CustomProvider for audit/dev mode which logs but doesn't verify.
 */

import { initializeAppCheck, CustomProvider } from 'firebase/app-check'
import { firebaseApp } from '../firebase/config'
import React, { useEffect, useState } from 'react'

// Custom provider for audit/dev mode
// In production (Phase 12), this will be replaced with ReCaptchaEnterpriseProvider
const createAuditProvider = () => {
  return new CustomProvider({
    getToken: async () => {
      // In audit mode, return a placeholder token
      // The token will be logged but not verified against reCAPTCHA
      if (import.meta.env.DEV) {
        console.debug('[AppCheck Audit] Generating placeholder token')
      }

      return {
        token: 'placeholder-audit-token-' + Date.now(),
        expireTimeMillis: Date.now() + 3600000, // 1 hour
      }
    },
  })
}

/**
 * App Check Provider component.
 * Wraps the app with App Check initialization in audit mode.
 *
 * For Phase 3: Audit mode - logs tokens but doesn't block traffic
 * For Phase 12: Switch to ReCaptchaEnterpriseProvider with real site key
 */
export function AppCheckProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized) return

    try {
      const provider = createAuditProvider()

      initializeAppCheck(firebaseApp, {
        provider,
        isTokenAutoRefreshEnabled: true,
      })

      if (import.meta.env.DEV) {
        console.debug('[AppCheck] Initialized in audit mode')
      }

      setInitialized(true)
    } catch (error) {
      // Log but don't block - App Check failure in audit mode shouldn't prevent app load
      console.warn('[AppCheck] Initialization failed, continuing without App Check:', error)
      setInitialized(true) // Mark as initialized to prevent retry loops
    }
  }, [initialized])

  // Render children immediately - App Check is non-blocking in audit mode
  return <>{children}</>
}
