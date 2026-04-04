importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

const DB_NAME = 'fcm-config-db'
const DB_VERSION = 1
const STORE_NAME = 'fcm-config'
const CONFIG_KEY = 'firebase-config'

function getFirebaseConfigFromIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const getRequest = store.get(CONFIG_KEY)

      getRequest.onsuccess = () => {
        resolve(getRequest.result ? getRequest.result.config : null)
      }
      getRequest.onerror = () => reject(getRequest.error)
    }
  })
}

async function getFirebaseConfigWithRetry(retries = 4, delayMs = 500) {
  let currentDelay = delayMs

  for (let attempt = 0; attempt < retries; attempt += 1) {
    const config = await getFirebaseConfigFromIDB()
    if (config) {
      return config
    }

    await new Promise((resolve) => setTimeout(resolve, currentDelay))
    currentDelay *= 2
  }

  return null
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url =
    event.notification.data?.url ||
    event.notification.data?.click_action ||
    '/app/alerts'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client && client.url.includes('/app/alerts')) {
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }

      return undefined
    })
  )
})

async function initializeMessaging() {
  const config = await getFirebaseConfigWithRetry()
  if (!config) {
    console.warn('[FCM SW] Firebase config unavailable')
    return
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(config)
  }

  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || 'Bantayog Alert'
    const options = {
      body: payload.notification?.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: payload.data || { url: '/app/alerts' },
      tag: payload.data?.announcementId || 'announcement',
    }

    return self.registration.showNotification(title, options)
  })
}

initializeMessaging().catch((error) => {
  console.error('[FCM SW] Initialization failed', error)
})
