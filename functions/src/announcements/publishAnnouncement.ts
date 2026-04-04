import * as functions from 'firebase-functions'
import { getFirestore } from 'firebase-admin/firestore'
import { z } from 'zod'
import { isSuperadmin } from '../auth/claims'
import {
  validateAuthenticated,
  validateMunicipalAdmin,
} from '../security/validateAuth'
import {
  AnnouncementStatus,
  type Announcement,
} from '../types/announcement'
import { sendAnnouncementPush } from './sendAnnouncementPush'

const PublishAnnouncementSchema = z.object({
  announcementId: z.string().min(1),
})

export const publishAnnouncement = functions.https.onCall(
  async (data: unknown, context) => {
    validateAuthenticated(context)

    const parsed = PublishAnnouncementSchema.safeParse(data)
    if (!parsed.success) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid publish request',
        { errors: parsed.error.issues }
      )
    }

    const { announcementId } = parsed.data
    const db = getFirestore()
    const announcementRef = db.collection('announcements').doc(announcementId)
    const snapshot = await announcementRef.get()

    if (!snapshot.exists) {
      throw new functions.https.HttpsError('not-found', 'Announcement not found')
    }

    const announcement = snapshot.data() as Announcement
    if (announcement.status !== AnnouncementStatus.Draft) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Only draft announcements can be published'
      )
    }

    if (announcement.targetScope.type === 'province') {
      if (!isSuperadmin(context.auth!.token)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only provincial superadmins can publish province-wide announcements'
        )
      }
    } else if (announcement.targetScope.type === 'multi_municipality') {
      if (!isSuperadmin(context.auth!.token)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only provincial superadmins can publish multi-municipality announcements'
        )
      }
    } else {
      validateMunicipalAdmin(
        context,
        announcement.targetScope.municipalityCodes[0]
      )
    }

    const now = new Date().toISOString()
    await announcementRef.update({
      status: AnnouncementStatus.Published,
      publishedAt: now,
      updatedAt: now,
    })

    let delivery = {
      sent: 0,
      successCount: 0,
      failureCount: 0,
    }

    try {
      delivery = await sendAnnouncementPush(
        announcementId,
        announcement.targetScope
      )
    } catch (error) {
      console.error(
        'Announcement push delivery failed after publication',
        announcementId,
        error
      )
    }

    return {
      success: true,
      announcementId,
      delivery,
    }
  }
)
