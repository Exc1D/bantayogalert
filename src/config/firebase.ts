import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getFunctions, Functions } from 'firebase/functions'
import { getMessaging, Messaging } from 'firebase/messaging'
import { connectFirestoreEmulator } from 'firebase/firestore'
import { connectAuthEmulator } from 'firebase/auth'
import { connectStorageEmulator } from 'firebase/storage'
import { connectFunctionsEmulator } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    const app = initializeApp(firebaseConfig)
    if (import.meta.env.VITE_USE_EMULATOR === 'true') {
      // Must connect emulators before any service is used
      connectAuthEmulator(getAuth(app), 'http://localhost:9099')
      connectFirestoreEmulator(getFirestore(app), 'localhost', 8080)
      connectStorageEmulator(getStorage(app), 'localhost', 9199)
      connectFunctionsEmulator(getFunctions(app), 'localhost', 5001)
      console.log('[Firebase] Connected to local emulators')
    }
    return app
  }
  return getApps()[0]!
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp())
}

export function getFirebaseFirestore(): Firestore {
  return getFirestore(getFirebaseApp())
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp())
}

export function getFirebaseFunctions(): Functions {
  return getFunctions(getFirebaseApp())
}

export function getFirebaseMessaging(): Messaging | undefined {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    return getMessaging(getFirebaseApp())
  }
  return undefined
}
