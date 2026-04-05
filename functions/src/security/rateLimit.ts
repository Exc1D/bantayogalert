/**
 * Per-user rate limiting for Cloud Functions.
 *
 * Default: 5 reports per hour per user
 * Surge mode: 20 reports per hour per user (admin-enabled per municipality)
 *
 * Uses Firestore documents for distributed rate limit state.
 */

import * as admin from 'firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

function getDb() {
  return admin.firestore()
}

// Rate limit configuration
const DEFAULT_RATE_LIMIT = {
  maxReports: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
}

const SURGE_RATE_LIMIT = {
  maxReports: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
}

// Surge mode defaults
const DEFAULT_SURGE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export interface RateLimitRecord {
  count: number
  windowStart: Timestamp
  surgeMode: boolean
  surgeModeExpires: Timestamp | null
}

export interface SurgeConfig {
  enabled: boolean
  expiresAt: Timestamp
  enabledBy: string
}

/**
 * Check if a user is within their rate limit for report creation.
 *
 * @param userId - The Firebase Auth UID of the user
 * @param _isAdminRequest - Whether this is an admin-privileged request (future use)
 * @returns Promise with rate limit result
 */
export async function checkRateLimit(
  userId: string,
  _isAdminRequest: boolean = false
): Promise<RateLimitResult> {
  const db = getDb()
  const rateLimitDoc = db.doc(`rate_limits/${userId}`)
  const doc = await rateLimitDoc.get()

  const now = Timestamp.now()
  const windowMs = DEFAULT_RATE_LIMIT.windowMs

  // Determine effective limit (check for surge mode)
  let effectiveLimit = DEFAULT_RATE_LIMIT.maxReports

  if (doc.exists) {
    const data = doc.data() as RateLimitRecord

    // Check if user's personal surge mode is active
    if (data.surgeMode && data.surgeModeExpires) {
      if (data.surgeModeExpires.toMillis() > now.toMillis()) {
        effectiveLimit = SURGE_RATE_LIMIT.maxReports
      }
    }

    // Check window expiration
    const windowStart = data.windowStart
    if (windowStart) {
      const windowEnd = windowStart.toMillis() + windowMs

      if (now.toMillis() >= windowEnd) {
        // Window expired - reset
        return {
          allowed: true,
          remaining: effectiveLimit - 1,
          resetAt: new Date(now.toMillis() + windowMs),
        }
      }

      // Within window - check count
      if (data.count >= effectiveLimit) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(windowStart.toMillis() + windowMs),
        }
      }

      return {
        allowed: true,
        remaining: effectiveLimit - data.count - 1,
        resetAt: new Date(windowStart.toMillis() + windowMs),
      }
    }
  }

  // No record exists - allow
  return {
    allowed: true,
    remaining: effectiveLimit - 1,
    resetAt: new Date(now.toMillis() + windowMs),
  }
}

/**
 * Atomically increment the rate limit counter for a user.
 * Uses Firestore transaction to prevent race conditions.
 *
 * @param userId - The Firebase Auth UID of the user
 */
export async function incrementRateLimit(userId: string): Promise<void> {
  const db = getDb()
  const rateLimitDoc = db.doc(`rate_limits/${userId}`)
  const now = Timestamp.now()

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(rateLimitDoc)

    if (!doc.exists) {
      // Create new rate limit record
      transaction.set(rateLimitDoc, {
        count: 1,
        windowStart: now,
        surgeMode: false,
        surgeModeExpires: null,
      })
      return
    }

    const data = doc.data() as RateLimitRecord
    const windowMs = DEFAULT_RATE_LIMIT.windowMs

    // Check if window expired
    if (data.windowStart) {
      const windowEnd = data.windowStart.toMillis() + windowMs

      if (now.toMillis() >= windowEnd) {
        // Reset window
        transaction.update(rateLimitDoc, {
          count: 1,
          windowStart: now,
        })
        return
      }
    }

    // Increment existing counter
    transaction.update(rateLimitDoc, {
      count: FieldValue.increment(1),
    })
  })
}

/**
 * Check if surge mode is active for a municipality.
 *
 * @param municipalityCode - The municipality code
 * @returns Promise with true if surge mode is active
 */
export async function isSurgeModeActive(municipalityCode: string): Promise<boolean> {
  const db = getDb()
  const surgeDoc = db.doc(`rate_limits/surge/${municipalityCode}`)
  const doc = await surgeDoc.get()

  if (!doc.exists) {
    return false
  }

  const data = doc.data() as SurgeConfig
  const now = Timestamp.now()

  return data.enabled && data.expiresAt.toMillis() > now.toMillis()
}

/**
 * Set surge mode for a municipality.
 * Only callable by municipal_admin or superadmin.
 *
 * @param municipalityCode - The municipality code
 * @param enabled - Whether to enable or disable surge mode
 * @param durationMs - Duration in milliseconds (default 24 hours)
 */
export async function setSurgeMode(
  municipalityCode: string,
  enabled: boolean,
  durationMs: number = DEFAULT_SURGE_DURATION_MS
): Promise<void> {
  const db = getDb()
  const surgeDoc = db.doc(`rate_limits/surge/${municipalityCode}`)
  const now = Timestamp.now()

  if (enabled) {
    const expiresAt = Timestamp.fromMillis(now.toMillis() + durationMs)

    await surgeDoc.set({
      enabled: true,
      expiresAt,
      enabledBy: 'system', // Will be overridden by caller UID
    })
  } else {
    await surgeDoc.set({
      enabled: false,
      expiresAt: null,
    })
  }
}

/**
 * Enable surge mode for a municipality for a specific admin.
 *
 * @param municipalityCode - The municipality code
 * @param enabledBy - The admin UID who enabled surge mode
 * @param durationMs - Duration in milliseconds
 */
export async function enableSurgeModeForMunicipality(
  municipalityCode: string,
  enabledBy: string,
  durationMs: number = DEFAULT_SURGE_DURATION_MS
): Promise<void> {
  const db = getDb()
  const surgeDoc = db.doc(`rate_limits/surge/${municipalityCode}`)
  const now = Timestamp.now()
  const expiresAt = Timestamp.fromMillis(now.toMillis() + durationMs)

  await surgeDoc.set({
    enabled: true,
    expiresAt,
    enabledBy,
  })
}

/**
 * Disable surge mode for a municipality.
 *
 * @param municipalityCode - The municipality code
 */
export async function disableSurgeModeForMunicipality(
  municipalityCode: string
): Promise<void> {
  const db = getDb()
  const surgeDoc = db.doc(`rate_limits/surge/${municipalityCode}`)
  await surgeDoc.set({
    enabled: false,
    expiresAt: null,
  })
}
