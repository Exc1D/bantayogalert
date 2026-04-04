import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from 'firebase/messaging'
import { firebaseApp } from './config'

const SW_CONFIG_DB = 'fcm-config-db'
const SW_CONFIG_STORE = 'fcm-config'
const SW_CONFIG_KEY = 'firebase-config'

export let messaging: Messaging | null = null

let messagingSupported: boolean | null = null
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null

function writeSwConfigToIDB(): Promise<void> {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SW_CONFIG_DB, 1)

    request.onerror = () => reject(request.error)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(SW_CONFIG_STORE)) {
        db.createObjectStore(SW_CONFIG_STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(SW_CONFIG_STORE, 'readwrite')
      const store = transaction.objectStore(SW_CONFIG_STORE)

      store.put({
        id: SW_CONFIG_KEY,
        config,
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    }
  })
}

async function ensureMessagingSupport(): Promise<boolean> {
  if (messagingSupported !== null) {
    return messagingSupported
  }

  messagingSupported = await isSupported().catch(() => false)
  return messagingSupported
}

async function ensureServiceWorkerRegistration() {
  if (serviceWorkerRegistration) {
    return serviceWorkerRegistration
  }

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  await setSwConfig()
  serviceWorkerRegistration = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js',
    { scope: '/' }
  )

  return serviceWorkerRegistration
}

export async function setSwConfig(): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    return
  }

  try {
    await writeSwConfigToIDB()
  } catch (error) {
    console.error('[FCM] Failed to persist service worker config', error)
  }
}

export async function getMessagingInstance(): Promise<Messaging | null> {
  if (messaging) {
    return messaging
  }

  if (typeof window === 'undefined') {
    return null
  }

  const supported = await ensureMessagingSupport()
  if (!supported) {
    return null
  }

  await ensureServiceWorkerRegistration()
  messaging = getMessaging(firebaseApp)

  return messaging
}

export async function requestFcmToken(): Promise<string | null> {
  const instance = await getMessagingInstance()
  if (!instance) {
    return null
  }

  if (typeof Notification === 'undefined') {
    return null
  }

  let permission = Notification.permission
  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }

  if (permission !== 'granted') {
    return null
  }

  const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY
  if (!vapidKey) {
    console.warn('VITE_FCM_VAPID_KEY is not configured')
    return null
  }

  try {
    const registration = await ensureServiceWorkerRegistration()

    return await getToken(instance, {
      vapidKey,
      serviceWorkerRegistration: registration ?? undefined,
    })
  } catch (error) {
    console.error('[FCM] Failed to get registration token', error)
    return null
  }
}

export async function onMessageInApp(
  callback: Parameters<typeof onMessage>[1]
): Promise<() => void> {
  const instance = await getMessagingInstance()
  if (!instance) {
    return () => {}
  }

  return onMessage(instance, callback)
}
