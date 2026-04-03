import { initializeApp, getApps } from 'firebase/app'
import type { FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import type { Auth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import type { FirebaseStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import type { Functions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const getFirebaseApp = (): FirebaseApp => {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig)
  }
  return getApps()[0]
}

export const getFirebaseAuth = (): Auth => getAuth(getFirebaseApp())
export const getFirebaseFirestore = (): Firestore => getFirestore(getFirebaseApp())
export const getFirebaseStorage = (): FirebaseStorage => getStorage(getFirebaseApp())
export const getFirebaseFunctions = (): Functions => getFunctions(getFirebaseApp())
