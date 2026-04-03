import { setPersistence, browserLocalPersistence } from 'firebase/auth'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../firebase/config'

/**
 * Configure Firebase Auth persistence to browser local storage.
 * This ensures user sessions persist across browser refreshes.
 * Called once at app startup before any auth operation (D-45).
 */
export async function configureAuthPersistence(): Promise<void> {
  await setPersistence(auth, browserLocalPersistence)
}

/**
 * Subscribe to Firebase Auth state changes.
 * Calls the callback immediately with the current user and on every change.
 */
export function observeAuthState(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback)
}
