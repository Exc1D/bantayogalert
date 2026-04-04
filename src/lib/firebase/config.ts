import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, type FirebaseStorage, connectStorageEmulator } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Validate required config keys at runtime (D-06)
const requiredKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
]

export const firebaseRuntime = {
  useEmulator: import.meta.env.VITE_USE_EMULATOR === 'true',
  appCheckMode: import.meta.env.VITE_APP_CHECK_MODE ?? 'audit',
  appCheckDebugToken: import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN ?? '',
  appCheckSiteKey: import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY ?? '',
}

for (const key of requiredKeys) {
  if (!firebaseConfig[key]) {
    throw new Error(
      `Missing required Firebase configuration: ${key}. ` +
        `Ensure VITE_FIREBASE_${key} is set in your .env.local file.`
    )
  }
}

function getOrInitializeFirebase(): {
  app: FirebaseApp
  auth: Auth
  db: Firestore
  storage: FirebaseStorage
} {
  const existingApps = getApps()
  const app =
    existingApps.length > 0
      ? existingApps[0]!
      : initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)
  const storage = getStorage(app)

  // Connect to Firebase Emulators when VITE_USE_EMULATOR=true
  if (firebaseRuntime.useEmulator) {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectStorageEmulator(storage, 'localhost', 9199)
  }

  return { app, auth, db, storage }
}

export const firebase = getOrInitializeFirebase()
export const { app: firebaseApp, auth, db, storage } = firebase
