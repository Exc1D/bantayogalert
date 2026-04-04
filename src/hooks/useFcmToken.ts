import { useEffect, useRef } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { requestFcmToken } from '@/lib/firebase/messaging'

interface UseFcmTokenOptions {
  userId: string
  municipalityCode: string | null
  enabled?: boolean
}

export function useFcmToken({
  userId,
  municipalityCode,
  enabled = true,
}: UseFcmTokenOptions): void {
  const registeredKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !userId) {
      return
    }

    const registrationKey = `${userId}:${municipalityCode ?? 'none'}`
    if (registeredKeyRef.current === registrationKey) {
      return
    }

    registeredKeyRef.current = registrationKey

    async function registerToken() {
      const token = await requestFcmToken()
      if (!token) {
        return
      }

      try {
        await addDoc(collection(db, 'users', userId, 'fcmTokens'), {
          token,
          municipalityCode,
          enabled: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      } catch (error) {
        console.error('[FCM] Failed to store registration token', error)
      }
    }

    void registerToken()
  }, [enabled, municipalityCode, userId])
}
