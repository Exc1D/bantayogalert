import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { z } from 'zod'
import { validateAuthenticated } from '../security/validateAuth'

const SubscribeAnnouncementTopicsSchema = z.object({
  token: z.string().min(1),
  municipalityCode: z.string().min(3).max(4).nullable().optional(),
})

export const subscribeAnnouncementTopics = functions.https.onCall(
  async (data: unknown, context) => {
    validateAuthenticated(context)

    const parsed = SubscribeAnnouncementTopicsSchema.safeParse(data)
    if (!parsed.success) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid topic subscription payload',
        { errors: parsed.error.issues }
      )
    }

    const { token } = parsed.data
    const claims = context.auth!.token as { municipalityCode?: string | null }
    const municipalityCode = claims.municipalityCode ?? parsed.data.municipalityCode ?? null

    const topics = ['province_CMN']
    if (municipalityCode) {
      topics.push(`municipality_${municipalityCode}`)
    }

    await Promise.all(
      topics.map((topic) => admin.messaging().subscribeToTopic([token], topic))
    )

    return {
      success: true,
      topics,
    }
  }
)
