import * as admin from 'firebase-admin'
import type { MulticastMessage } from 'firebase-admin/messaging'
import type { Announcement, AnnouncementTargetScope } from '../types/announcement'

const FCM_BATCH_SIZE = 500
const MAX_IN_QUERY_VALUES = 10

interface Recipient {
  userId: string
  token: string
  tokenRef: FirebaseFirestore.DocumentReference
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

async function getRecipientUsers(
  targetScope: AnnouncementTargetScope
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  const db = admin.firestore()

  if (targetScope.type === 'province') {
    const snapshot = await db.collection('users').get()
    return snapshot.docs
  }

  const municipalityChunks = chunk(
    targetScope.municipalityCodes,
    MAX_IN_QUERY_VALUES
  )

  const snapshots = await Promise.all(
    municipalityChunks.map((codes) =>
      db.collection('users').where('municipalityCode', 'in', codes).get()
    )
  )

  const deduped = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>()
  for (const snapshot of snapshots) {
    for (const doc of snapshot.docs) {
      deduped.set(doc.id, doc)
    }
  }

  return [...deduped.values()]
}

function buildNotificationStatus(
  successCount: number,
  failureCount: number
): 'sent' | 'partial' | 'failed' {
  if (failureCount === 0) return 'sent'
  if (successCount === 0) return 'failed'
  return 'partial'
}

export async function sendAnnouncementPush(
  announcementId: string,
  targetScope: AnnouncementTargetScope
): Promise<{ sent: number; successCount: number; failureCount: number }> {
  const db = admin.firestore()
  const messaging = admin.messaging()

  const announcementSnapshot = await db
    .collection('announcements')
    .doc(announcementId)
    .get()

  if (!announcementSnapshot.exists) {
    throw new Error(`Announcement ${announcementId} not found`)
  }

  const announcement = announcementSnapshot.data() as Announcement
  const users = await getRecipientUsers(targetScope)

  const recipients: Recipient[] = []
  const seenTokens = new Set<string>()

  await Promise.all(
    users
      .filter(
        (userDoc) =>
          userDoc.data().notificationPreferences?.pushEnabled !== false
      )
      .map(async (userDoc) => {
        const tokensSnapshot = await db
          .collection('users')
          .doc(userDoc.id)
          .collection('fcmTokens')
          .where('enabled', '==', true)
          .get()

        for (const tokenDoc of tokensSnapshot.docs) {
          const token = tokenDoc.data().token
          if (typeof token !== 'string' || seenTokens.has(token)) {
            continue
          }

          seenTokens.add(token)
          recipients.push({
            userId: userDoc.id,
            token,
            tokenRef: tokenDoc.ref,
          })
        }
      })
  )

  if (recipients.length === 0) {
    return {
      sent: 0,
      successCount: 0,
      failureCount: 0,
    }
  }

  const batchedRecipients = chunk(recipients, FCM_BATCH_SIZE)
  const notificationSummaries = new Map<
    string,
    {
      tokenCount: number
      successCount: number
      failureCount: number
      errors: string[]
    }
  >()

  let totalSuccess = 0
  let totalFailure = 0
  const now = new Date().toISOString()

  for (const recipientBatch of batchedRecipients) {
    const message: MulticastMessage = {
      tokens: recipientBatch.map((recipient) => recipient.token),
      notification: {
        title: announcement.title,
        body: announcement.body,
      },
      data: {
        announcementId,
        type: announcement.type,
        severity: announcement.severity,
        url: '/app/alerts',
      },
      webpush: {
        fcmOptions: {
          link: '/app/alerts',
        },
      },
    }

    const response = await messaging.sendEachForMulticast(message)
    totalSuccess += response.successCount
    totalFailure += response.failureCount

    const invalidTokenBatch = db.batch()
    let hasInvalidTokenUpdates = false

    response.responses.forEach((result, index) => {
      const recipient = recipientBatch[index]
      if (!recipient) return

      const summary = notificationSummaries.get(recipient.userId) ?? {
        tokenCount: 0,
        successCount: 0,
        failureCount: 0,
        errors: [],
      }

      summary.tokenCount += 1

      if (result.success) {
        summary.successCount += 1
      } else {
        summary.failureCount += 1
        if (result.error?.message) {
          summary.errors.push(result.error.message)
        }

        if (
          result.error?.code === 'messaging/registration-token-not-registered' ||
          result.error?.code === 'messaging/invalid-registration-token'
        ) {
          invalidTokenBatch.update(recipient.tokenRef, {
            enabled: false,
            updatedAt: now,
            disabledReason: result.error.code,
          })
          hasInvalidTokenUpdates = true
        }
      }

      notificationSummaries.set(recipient.userId, summary)
    })

    if (hasInvalidTokenUpdates) {
      await invalidTokenBatch.commit()
    }
  }

  const notificationEntries = [...notificationSummaries.entries()]
  for (const entries of chunk(notificationEntries, 500)) {
    const batch = db.batch()

    for (const [userId, summary] of entries) {
      batch.set(
        db
          .collection('announcements')
          .doc(announcementId)
          .collection('notifications')
          .doc(userId),
        {
          userId,
          status: buildNotificationStatus(
            summary.successCount,
            summary.failureCount
          ),
          tokenCount: summary.tokenCount,
          successCount: summary.successCount,
          failureCount: summary.failureCount,
          errors: summary.errors.slice(0, 10),
          lastSentAt: now,
        },
        { merge: true }
      )
    }

    await batch.commit()
  }

  return {
    sent: recipients.length,
    successCount: totalSuccess,
    failureCount: totalFailure,
  }
}
