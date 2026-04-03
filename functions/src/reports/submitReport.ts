/**
 * submitReport Cloud Function
 *
 * Callable CF that creates three Firestore documents atomically:
 * - reports/{reportId}: public document with geohash location, workflowState=pending
 * - report_private/{reportId}: exact location, reporter info, ownerStatus=submitted
 * - report_ops/{reportId}: empty initial document for admin operations
 *
 * Input validation (Zod):
 * - type, severity: enums
 * - description: 10-2000 chars
 * - municipalityCode: 3-4 chars
 * - barangayCode: 6-7 chars
 * - exactLocation: lat 13.8-14.8, lng 122.3-123.3
 * - mediaUrls: max 5 URLs
 */

import * as functions from 'firebase-functions'
import { getFirestore } from 'firebase-admin/firestore'
import { z } from 'zod'
import ngeohash from 'ngeohash'

import {
  validateAuthenticated,
  validateRole,
  checkRateLimit,
  incrementRateLimit,
  sanitizeReportInput,
} from '../security'
import { UserRole } from '../auth/claims'

// Input validation schema
const SubmitReportDataSchema = z.object({
  type: z.enum(['flood', 'landslide', 'fire', 'earthquake', 'medical', 'vehicle_accident', 'crime', 'other']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  description: z.string().min(10).max(2000),
  municipalityCode: z.string().min(3).max(4),
  barangayCode: z.string().min(6).max(7),
  exactLocation: z.object({
    lat: z.number().min(13.8).max(14.8),
    lng: z.number().min(122.3).max(123.3),
  }),
  mediaUrls: z.array(z.string().url()).max(5).default([]),
})

export type SubmitReportData = z.infer<typeof SubmitReportDataSchema>

export const submitReport = functions.https.onCall(
  async (data: SubmitReportData, context: functions.https.CallableContext) => {
    // 1. Validate authentication
    validateAuthenticated(context)

    const userId = context.auth!.uid
    const userEmail = context.auth!.token.email || ''
    const userName = context.auth!.token.name || ''

    // 2. Validate role is citizen
    validateRole(context, UserRole.Citizen)

    // 3. Parse and validate input data
    const parsedData = SubmitReportDataSchema.safeParse(data)
    if (!parsedData.success) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid report data',
        { errors: parsedData.error.errors }
      )
    }

    const { type, severity, description, municipalityCode, barangayCode, exactLocation, mediaUrls } = parsedData.data

    // 4. Rate limit check
    const rateLimitResult = await checkRateLimit(userId)
    if (!rateLimitResult.allowed) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Report rate limit exceeded. Please try again later.',
        {
          remaining: rateLimitResult.remaining,
          resetAt: rateLimitResult.resetAt.toISOString(),
        }
      )
    }

    // 5. Sanitize text input
    const sanitizedData = sanitizeReportInput({
      type,
      severity,
      description,
      municipalityCode,
      barangayCode,
      mediaUrls,
    }) as {
      type: string
      severity: string
      description: string
      municipalityCode: string
      barangayCode: string
      mediaUrls: string[]
    }

    // 6. Compute geohash for public location (9-char precision)
    const geohash = ngeohash.encode(exactLocation.lat, exactLocation.lng, 9)

    const db = getFirestore()

    // Generate reportId BEFORE transaction
    const reportRef = db.collection('reports').doc()
    const reportId = reportRef.id

    const now = new Date().toISOString()

    // 7. Atomic transaction: create all three documents
    await db.runTransaction(async (tx) => {
      // reports/{reportId}: public document
      tx.set(reportRef, {
        id: reportId,
        type: sanitizedData.type,
        severity: sanitizedData.severity,
        description: sanitizedData.description,
        location: {
          lat: exactLocation.lat,
          lng: exactLocation.lng,
          geohash,
        },
        municipalityCode: sanitizedData.municipalityCode,
        barangayCode: sanitizedData.barangayCode,
        mediaUrls: sanitizedData.mediaUrls,
        createdAt: now,
        updatedAt: now,
        reporterId: userId,
        workflowState: 'pending',
        verified: false,
      })

      // report_private/{reportId}: owner document with exact location
      const reportPrivateRef = db.collection('report_private').doc(reportId)
      tx.set(reportPrivateRef, {
        id: reportId,
        exactLocation,
        reporterEmail: userEmail,
        reporterName: userName,
        ownerStatus: 'submitted',
        activityLog: [
          {
            action: 'created',
            performedBy: userId,
            performedAt: now,
            details: 'Report submitted',
          },
        ],
      })

      // report_ops/{reportId}: empty initial document for admin operations
      const reportOpsRef = db.collection('report_ops').doc(reportId)
      tx.set(reportOpsRef, {
        id: reportId,
      })
    })

    // 8. Increment rate limit counter
    await incrementRateLimit(userId)

    return { reportId }
  }
)
