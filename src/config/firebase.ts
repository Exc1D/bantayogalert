import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getFunctions, Functions } from 'firebase/functions'
import { getMessaging, Messaging } from 'firebase/messaging'

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
    return initializeApp(firebaseConfig)
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
