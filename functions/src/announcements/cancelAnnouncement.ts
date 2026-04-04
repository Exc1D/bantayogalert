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
import { appendAuditEntry } from '../audit/shared'
import type { AuditActorRole } from '../types/audit'

const CancelAnnouncementSchema = z.object({
  announcementId: z.string().min(1),
})

export const cancelAnnouncement = functions.https.onCall(
  async (data: unknown, context) => {
    validateAuthenticated(context)

    const parsed = CancelAnnouncementSchema.safeParse(data)
    if (!parsed.success) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid cancel request',
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

    if (announcement.status === AnnouncementStatus.Cancelled) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Announcement is already cancelled'
      )
    }

    if (announcement.targetScope.type === 'province') {
      if (!isSuperadmin(context.auth!.token)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only provincial superadmins can cancel province-wide announcements'
        )
      }
    } else if (announcement.targetScope.type === 'multi_municipality') {
      if (!isSuperadmin(context.auth!.token)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only provincial superadmins can cancel multi-municipality announcements'
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
      status: AnnouncementStatus.Cancelled,
      cancelledAt: now,
      updatedAt: now,
    })

    await appendAuditEntry(null, db, {
      entityType: 'announcement',
      entityId: announcementId,
      action: 'announcement_cancel',
      actorUid: context.auth!.uid,
      actorRole: (context.auth!.token.role as AuditActorRole | undefined) ?? 'citizen',
      municipalityCode:
        announcement.targetScope.type === 'province'
          ? null
          : announcement.targetScope.municipalityCodes[0] ?? null,
      provinceCode: 'CMN',
      createdAt: now,
      details: {
        status: AnnouncementStatus.Cancelled,
        previousStatus: announcement.status,
        targetScopeType: announcement.targetScope.type,
      },
    })

    return {
      success: true,
      announcementId,
    }
  }
)
