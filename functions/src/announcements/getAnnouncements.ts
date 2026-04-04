import * as functions from 'firebase-functions'
import { getFirestore, type Query } from 'firebase-admin/firestore'
import { z } from 'zod'
import {
  AnnouncementStatus,
  AnnouncementType,
  type Announcement,
} from '../types/announcement'
import { validateAuthenticated } from '../security/validateAuth'

const GetAnnouncementsSchema = z.object({
  type: z.nativeEnum(AnnouncementType).optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional().default(20),
})

function sortAnnouncements(
  left: Announcement,
  right: Announcement
): number {
  const leftTime = left.publishedAt ?? left.createdAt
  const rightTime = right.publishedAt ?? right.createdAt

  if (leftTime === rightTime) {
    return right.id.localeCompare(left.id)
  }

  return rightTime.localeCompare(leftTime)
}

export const getAnnouncements = functions.https.onCall(
  async (data: unknown, context) => {
    validateAuthenticated(context)

    const parsed = GetAnnouncementsSchema.safeParse(data)
    if (!parsed.success) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid announcement query',
        { errors: parsed.error.issues }
      )
    }

    const { type, cursor, limit } = parsed.data
    const claims = context.auth!.token as {
      role?: string
      municipalityCode?: string | null
    }
    const municipalityCode = claims.municipalityCode ?? null
    const isProvincialSuperadmin = claims.role === 'provincial_superadmin'

    const db = getFirestore()
    let cursorSnapshot:
      | FirebaseFirestore.DocumentSnapshot
      | null = null

    if (cursor) {
      const cursorDoc = await db.collection('announcements').doc(cursor).get()
      cursorSnapshot = cursorDoc.exists ? cursorDoc : null
    }

    const buildScopedQuery = (
      targetType: 'province' | 'municipality' | 'multi_municipality',
      includeMunicipalityFilter = false
    ) => {
      let queryRef: Query = db
        .collection('announcements')
        .where('status', '==', AnnouncementStatus.Published)
        .where('targetScope.type', '==', targetType)

      if (type) {
        queryRef = queryRef.where('type', '==', type)
      }

      if (includeMunicipalityFilter && municipalityCode) {
        queryRef = queryRef.where(
          'targetScope.municipalityCodes',
          'array-contains',
          municipalityCode
        )
      }

      queryRef = queryRef.orderBy('publishedAt', 'desc').limit(limit)

      if (cursorSnapshot) {
        queryRef = queryRef.startAfter(cursorSnapshot)
      }

      return queryRef
    }

    if (isProvincialSuperadmin) {
      let queryRef: Query = db
        .collection('announcements')
        .where('status', '==', AnnouncementStatus.Published)

      if (type) {
        queryRef = queryRef.where('type', '==', type)
      }

      queryRef = queryRef.orderBy('publishedAt', 'desc').limit(limit)

      if (cursorSnapshot) {
        queryRef = queryRef.startAfter(cursorSnapshot)
      }

      const snapshot = await queryRef.get()
      const announcements = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Announcement[]

      return {
        success: true,
        announcements,
        cursor: snapshot.docs.at(-1)?.id ?? null,
      }
    }

    const [provinceSnapshot, municipalitySnapshot, multiMunicipalitySnapshot] =
      await Promise.all([
        buildScopedQuery('province').get(),
        municipalityCode
          ? buildScopedQuery('municipality', true).get()
          : Promise.resolve(null),
        municipalityCode
          ? buildScopedQuery('multi_municipality', true).get()
          : Promise.resolve(null),
      ])

    const deduped = new Map<string, Announcement>()

    for (const snapshot of [
      provinceSnapshot,
      municipalitySnapshot,
      multiMunicipalitySnapshot,
    ]) {
      if (!snapshot) continue

      for (const doc of snapshot.docs) {
        if (!deduped.has(doc.id)) {
          deduped.set(doc.id, {
            id: doc.id,
            ...doc.data(),
          } as Announcement)
        }
      }
    }

    const announcements = [...deduped.values()]
      .sort(sortAnnouncements)
      .slice(0, limit)

    return {
      success: true,
      announcements,
      cursor: announcements.at(-1)?.id ?? null,
    }
  }
)
