import * as functions from 'firebase-functions'
import { getFirestore } from 'firebase-admin/firestore'
import { isSuperadmin } from '../auth/claims'
import { sanitizeAnnouncementInput } from '../security/sanitize'
import {
  validateAuthenticated,
  validateMunicipalAdmin,
} from '../security/validateAuth'
import {
  AnnouncementSchema,
  AnnouncementStatus,
  type AnnouncementInput,
} from '../types/announcement'

export const createAnnouncement = functions.https.onCall(
  async (data: unknown, context) => {
    validateAuthenticated(context)

    const parsed = AnnouncementSchema.safeParse(data)
    if (!parsed.success) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid announcement data',
        { errors: parsed.error.issues }
      )
    }

    const announcementData = parsed.data
    const claims = context.auth!.token

    if (
      announcementData.targetScope.type === 'province' ||
      announcementData.targetScope.type === 'multi_municipality'
    ) {
      if (!isSuperadmin(claims)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only provincial superadmins can target province-wide or multiple municipalities'
        )
      }
    } else {
      validateMunicipalAdmin(
        context,
        announcementData.targetScope.municipalityCodes[0]
      )
    }

    const sanitized = sanitizeAnnouncementInput(
      announcementData as Record<string, unknown>
    ) as AnnouncementInput

    const db = getFirestore()
    const announcementRef = db.collection('announcements').doc()
    const now = new Date().toISOString()

    await announcementRef.set({
      id: announcementRef.id,
      ...sanitized,
      status: AnnouncementStatus.Draft,
      createdBy: context.auth!.uid,
      createdAt: now,
      updatedAt: now,
    })

    return {
      success: true,
      id: announcementRef.id,
    }
  }
)
