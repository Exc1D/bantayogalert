import { connectAuthEmulator } from 'firebase/auth'
import { connectFirestoreEmulator } from 'firebase/firestore'
import { connectStorageEmulator } from 'firebase/storage'
import { connectFunctionsEmulator } from 'firebase/functions'
import { getFirebaseAuth, getFirebaseFirestore, getFirebaseStorage, getFirebaseFunctions } from './config'

const EMULATOR_HOST = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || 'localhost'
const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  storage: 9199,
  functions: 5001,
}

export const connectToEmulators = () => {
  if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    console.log('Connecting to Firebase Emulators...')
    connectAuthEmulator(getFirebaseAuth(), `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`, { disableWarnings: true })
    connectFirestoreEmulator(getFirebaseFirestore(), EMULATOR_HOST, EMULATOR_PORTS.firestore)
    connectStorageEmulator(getFirebaseStorage(), EMULATOR_HOST, EMULATOR_PORTS.storage)
    connectFunctionsEmulator(getFirebaseFunctions(), EMULATOR_HOST, EMULATOR_PORTS.functions)
  }
}
