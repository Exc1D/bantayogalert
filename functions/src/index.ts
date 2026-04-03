import * as functions from 'firebase-functions'

// STUB: Cloud Functions will be implemented starting in Phase 2 (Domain Model)
// This stub prevents TypeScript errors during the build phase.
export const stub = functions.https.onRequest((req, res) => {
  res.status(200).json({ status: 'ok', message: 'Cloud Functions stub' })
})
