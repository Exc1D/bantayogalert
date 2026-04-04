import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { onCall } from 'firebase-functions/v2/https'
import { setUserRole } from './auth/setUserRole'
import { onUserCreated } from './auth/onUserCreated'
import { submitReport } from './reports/submitReport'
import { createContact } from './contacts/createContact'
import { updateContact } from './contacts/updateContact'
import { deactivateContact } from './contacts/deactivateContact'
import { getContacts } from './contacts/getContacts'
import { triageVerify } from './triage/triageVerify'
import { triageReject } from './triage/triageReject'
import { triageDispatch } from './triage/triageDispatch'
import { triageAcknowledge } from './triage/triageAcknowledge'
import { triageInProgress } from './triage/triageInProgress'
import { triageResolve } from './triage/triageResolve'
import { triageReroute } from './triage/triageReroute'
import { triageUpdatePriority } from './triage/triageUpdatePriority'
import { triageUpdateNotes } from './triage/triageUpdateNotes'
import { createAnnouncement } from './announcements/createAnnouncement'
import { publishAnnouncement } from './announcements/publishAnnouncement'
import { cancelAnnouncement } from './announcements/cancelAnnouncement'
import { getAnnouncements } from './announcements/getAnnouncements'
import { subscribeAnnouncementTopics } from './announcements/subscribeAnnouncementTopics'
import { scheduledAggregation } from './analytics/scheduledAggregation'

if (admin.apps.length === 0) {
  admin.initializeApp()
}

// Security utilities
export {
  sanitizeText,
  sanitizeObject,
  sanitizeUserInput,
  sanitizeReportInput,
  sanitizeContactInput,
  sanitizeAnnouncementInput,
  checkRateLimit,
  incrementRateLimit,
  setSurgeMode,
  isSurgeModeActive,
  enableSurgeModeForMunicipality,
  disableSurgeModeForMunicipality,
  validateSuperadmin,
  validateMunicipalAdmin,
  validateAuthenticated,
  validateWriteScope,
  validateRole,
} from './security'

export { setUserRole }
export { onUserCreated }
export { submitReport }
export { createContact }
export { updateContact }
export { deactivateContact }
export { getContacts }
export { triageVerify }
export { triageReject }
export { triageDispatch }
export { triageAcknowledge }
export { triageInProgress }
export { triageResolve }
export { triageReroute }
export { triageUpdatePriority }
export { triageUpdateNotes }
export { createAnnouncement }
export { publishAnnouncement }
export { cancelAnnouncement }
export { getAnnouncements }
export { subscribeAnnouncementTopics }
export { scheduledAggregation }

/**
 * Set surge mode for a municipality.
 * Enables 20 reports/hour instead of 5 for the specified municipality.
 *
 * Callable by superadmin (any municipality) or municipal_admin (own municipality).
 */
export const setSurgeModeCF = onCall(async (request) => {
  const { auth } = request

  if (!auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }

  const { municipalityCode, enabled, durationMs } = request.data

  if (!municipalityCode || typeof municipalityCode !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'municipalityCode required')
  }

  // Validate caller has permission
  const { isSuperadmin, isMunicipalAdmin } = await import('./auth/claims')

  const claims = auth.token
  const isAdmin =
    isSuperadmin(claims) || isMunicipalAdmin(claims, municipalityCode)

  if (!isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Admin access required for this municipality'
    )
  }

  // Apply surge mode
  const duration = typeof durationMs === 'number' ? durationMs : 24 * 60 * 60 * 1000

  if (enabled) {
    const { enableSurgeModeForMunicipality } = await import('./security/rateLimit')
    await enableSurgeModeForMunicipality(municipalityCode, auth.uid, duration)
  } else {
    const { disableSurgeModeForMunicipality } = await import('./security/rateLimit')
    await disableSurgeModeForMunicipality(municipalityCode)
  }

  return {
    success: true,
    municipalityCode,
    enabled: Boolean(enabled),
  }
})

// Keep stub until more functions are added
export const stub = functions.https.onRequest((req, res) => {
  res.status(200).json({ status: 'ok' })
})
