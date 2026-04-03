import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { setCustomClaims } from './claims'

/**
 * Firebase Auth trigger that fires when a new user is created.
 * Sets default claims (citizen role, CMN province, null municipality)
 * and creates the Firestore user document.
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid
  const email = user.email ?? ''

  // Default claims: citizen role, CMN province, no municipality
  const defaultClaims = {
    role: 'citizen' as const,
    municipalityCode: null,
    provinceCode: 'CMN' as const,
  }

  // Set claims atomically: Firestore doc + ID token
  await setCustomClaims(uid, defaultClaims)

  // Also initialize the user document with default preferences
  // Note: setCustomClaims already sets role/municipalityCode/provinceCode via merge,
  // but we need to set notificationPreferences, email, displayName, and timestamps
  const db = admin.firestore()
  await db.doc(`users/${uid}`).set(
    {
      email,
      displayName: '',
      notificationPreferences: {
        pushEnabled: false,
        emailEnabled: true,
        alertTypes: ['all'],
      },
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  functions.logger.info(`User created with default claims: ${uid}`)
})
