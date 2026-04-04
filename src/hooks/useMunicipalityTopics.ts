import { useEffect, useRef } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { requestFcmToken } from '@/lib/firebase/messaging'

interface UseMunicipalityTopicsOptions {
  municipalityCode: string | null
  enabled?: boolean
}

export async function subscribeToMunicipalityTopics(
  municipalityCode: string | null
): Promise<void> {
  const token = await requestFcmToken()
  if (!token) {
    return
  }

  const fn = httpsCallable<
    { token: string; municipalityCode: string | null },
    { success: boolean; topics: string[] }
  >(getFunctions(), 'subscribeAnnouncementTopics')

  await fn({
    token,
    municipalityCode,
  })
}

export function useMunicipalityTopics({
  municipalityCode,
  enabled = true,
}: UseMunicipalityTopicsOptions): void {
  const subscriptionKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const key = municipalityCode ?? '__province_only__'
    if (subscriptionKeyRef.current === key) {
      return
    }

    subscriptionKeyRef.current = key
    void subscribeToMunicipalityTopics(municipalityCode).catch((error) => {
      console.error('[FCM] Failed to subscribe to announcement topics', error)
    })
  }, [enabled, municipalityCode])
}
