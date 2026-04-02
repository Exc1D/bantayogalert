import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

// Re-export callable functions from separate modules
export { setCustomClaims } from './setCustomClaims'
export { createAdminRequest, reviewAdminRequest } from './adminRequest'
export { transitionReport } from './reportWorkflow'

// ─── Scheduled Functions ───────────────────────────────────────────────────

export const pendingReportAutoReject = functions.pubsub
  .schedule('0 3 * * *') // Daily at 03:00 PHT
  .timeZone('Asia/Manila')
  .onRun(async () => {
    functions.logger.info('pendingReportAutoReject triggered')
    // Full implementation in Phase 6
    return null
  })

export const announcementExpiry = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async () => {
    functions.logger.info('announcementExpiry triggered')
    // Full implementation in Phase 8
    return null
  })
