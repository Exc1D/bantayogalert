import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const db = admin.firestore()

// ─── Types ─────────────────────────────────────────────────────────────────

type WorkflowStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'dispatched'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'

interface TransitionPayload {
  reportId: string
  newStatus: WorkflowStatus
  notes?: string
}

// ─── State Machine ─────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  pending:      ['verified', 'rejected'],
  verified:     ['dispatched'],
  dispatched:   ['acknowledged'],
  acknowledged: ['in_progress'],
  in_progress:  ['resolved'],
  rejected:     [],
  resolved:     [],
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function isValidTransition(current: WorkflowStatus, next: WorkflowStatus): boolean {
  return VALID_TRANSITIONS[current]?.includes(next) ?? false
}

function isRoleAllowed(
  role: string,
  municipality: string | null,
  reportMunicipality: string
): boolean {
  if (role === 'provincial_superadmin') return true
  if (role === 'municipal_admin' && municipality === reportMunicipality) return true
  return false
}

function getTimestampField(status: WorkflowStatus): string {
  switch (status) {
    case 'verified':     return 'verifiedAt'
    case 'rejected':    return 'rejectedAt'
    case 'acknowledged': return 'acknowledgedAt'
    case 'in_progress': return 'inProgressAt'
    case 'resolved':    return 'resolvedAt'
    default:            return ''
  }
}

function getActorField(status: WorkflowStatus): string {
  switch (status) {
    case 'verified':     return 'verifiedBy'
    case 'rejected':    return 'rejectedBy'
    case 'acknowledged': return 'acknowledgedBy'
    case 'in_progress': return 'inProgressBy'
    case 'resolved':    return 'resolvedBy'
    default:            return ''
  }
}

// ─── Callable: transitionReport ───────────────────────────────────────────

/**
 * Transitions a report to a new workflow status.
 *
 * Callable by:
 *   - municipal_admin (only for reports in their assigned municipality)
 *   - provincial_superadmin (all reports)
 *
 * Atomically:
 *   1. Validates the transition is allowed by the state machine
 *   2. Validates the caller has jurisdiction over the report's municipality
 *   3. Updates the report document (status + relevant actor/timestamp fields)
 *   4. Writes an entry to the report's activity subcollection
 */
export const transitionReport = functions.https.onCall(
  async (data: TransitionPayload, context: functions.https.CallableContext) => {
    // ── Auth check ────────────────────────────────────────────────────
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
    }

    const uid = context.auth.uid
    const role: string = context.auth.token.role ?? 'citizen'
    const municipality: string | null = context.auth.token.municipality ?? null

    // Admins only
    if (role !== 'municipal_admin' && role !== 'provincial_superadmin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can transition reports'
      )
    }

    // ── Input validation ─────────────────────────────────────────────
    const { reportId, newStatus, notes } = data

    if (!reportId || typeof reportId !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'reportId is required')
    }

    const validStatuses: WorkflowStatus[] = [
      'pending', 'verified', 'rejected',
      'dispatched', 'acknowledged', 'in_progress', 'resolved',
    ]
    if (!validStatuses.includes(newStatus)) {
      throw new functions.https.HttpsError('invalid-argument', `Invalid status: ${newStatus}`)
    }

    // Rejected and resolved transitions require notes
    if ((newStatus === 'rejected' || newStatus === 'resolved') && !notes) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `notes is required for transition to ${newStatus}`
      )
    }

    // ── Transaction ───────────────────────────────────────────────────
    const reportRef = db.collection('reports').doc(reportId)

    try {
      const result = await db.runTransaction(async (tx) => {
        const reportSnap = await tx.get(reportRef)

        if (!reportSnap.exists) {
          throw new functions.https.HttpsError('not-found', 'Report not found')
        }

        const report = reportSnap.data()!
        const currentStatus: WorkflowStatus = report.status as WorkflowStatus
        const reportMunicipality: string = report.assignedMunicipality

        // ── Scope check ──────────────────────────────────────────────
        if (!isRoleAllowed(role, municipality, reportMunicipality)) {
          throw new functions.https.HttpsError(
            'permission-denied',
            `You do not have jurisdiction over reports in ${reportMunicipality}`
          )
        }

        // ── State machine check ───────────────────────────────────────
        if (!isValidTransition(currentStatus, newStatus)) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            `Invalid transition: ${currentStatus} → ${newStatus}`
          )
        }

        // ── Build update map ─────────────────────────────────────────
        const updates: Record<string, unknown> = {
          status: newStatus,
          publicStatus: PUBLIC_STATUS_LABEL[newStatus],
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }

        const actorField = getActorField(newStatus)
        const timestampField = getTimestampField(newStatus)
        if (actorField) updates[actorField] = uid
        if (timestampField) updates[timestampField] = admin.firestore.FieldValue.serverTimestamp()

        // Status-specific fields
        if (newStatus === 'rejected') {
          updates.rejectedReason = notes ?? null
        }
        if (newStatus === 'resolved') {
          updates.resolvedNotes = notes ?? null
        }

        tx.update(reportRef, updates)

        // ── Activity log ────────────────────────────────────────────
        const activityRef = reportRef.collection('activity').doc()
        tx.set(activityRef, {
          actorUid: uid,
          actorRole: role,
          actorMunicipality: municipality,
          action: newStatus,
          previousState: currentStatus,
          newState: newStatus,
          notes: notes ?? null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })

        return { success: true, previousStatus: currentStatus, newStatus }
      })

      functions.logger.info(
        `[transitionReport] uid=${uid} report=${reportId} ` +
        `${result.previousStatus} → ${result.newStatus}`
      )

      return result
    } catch (err: unknown) {
      if (err instanceof functions.https.HttpsError) throw err

      functions.logger.error('[transitionReport] Transaction failed:', err)
      throw new functions.https.HttpsError('internal', 'Transition failed')
    }
  }
)

// ─── Labels (mirrors client-side PublicStatusLabel) ────────────────────────

const PUBLIC_STATUS_LABEL: Record<WorkflowStatus, string> = {
  pending:      'Pending Review',
  verified:     'Verified',
  rejected:     'Rejected',
  dispatched:   'Responder Dispatched',
  acknowledged: 'Responder En Route',
  in_progress:  'Situation Being Addressed',
  resolved:    'Resolved',
}
