import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendEmailVerification,
  type User,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { googleProvider } from './providers'
import { NotificationPreferences } from '../../types/user'

/**
 * Login with email/password.
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

/**
 * Register with email/password.
 * Creates Firebase Auth account, sends email verification, and creates Firestore user document.
 */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  const user = result.user

  // Update display name in Firebase Auth profile
  await updateProfile(user, { displayName })

  // Send email verification
  await sendEmailVerification(user)

  // Create user document in Firestore with default claims
  const defaultNotificationPreferences: NotificationPreferences = {
    pushEnabled: false,
    emailEnabled: true,
    alertTypes: ['all'],
  }

  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    displayName,
    role: 'citizen',
    provinceCode: 'CMN',
    municipalityCode: null,
    notificationPreferences: defaultNotificationPreferences,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return user
}

/**
 * Login with Google OAuth using popup.
 */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

/**
 * Logout the current user.
 */
export async function logout(): Promise<void> {
  await signOut(auth)
}

/**
 * Update user profile in Firestore.
 */
export async function updateUserProfile(data: {
  displayName?: string
  notificationPreferences?: NotificationPreferences
}): Promise<void> {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('No authenticated user')
  }

  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  }

  if (data.displayName !== undefined) {
    updates.displayName = data.displayName
  }

  if (data.notificationPreferences !== undefined) {
    updates.notificationPreferences = data.notificationPreferences
  }

  await updateDoc(doc(db, 'users', currentUser.uid), updates)
}
