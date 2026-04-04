/**
 * Shared utilities for all triage Cloud Functions.
 */
import * as functions from 'firebase-functions'
import type { ActivityLogEntry } from '../types/report'
import { canTransition } from '../types/workflow'
import type { WorkflowState } from '../types/report'

/**
 * Build an activity log entry for a triage action.
 */
export function buildActivityEntry(
  action: string,
  performedBy: string,
  details?: Record<string, unknown>
): ActivityLogEntry {
  return {
    action,
    performedBy,
    performedAt: new Date().toISOString(),
    details: details ? JSON.stringify(details) : undefined,
  }
}

/**
 * Validate that the current version matches the expected version (optimistic concurrency).
 * Throws failed-precondition if versions don't match.
 */
export function validateVersion(
  currentVersion: number,
  expectedVersion: number,
  reportId: string
): void {
  if (currentVersion !== expectedVersion) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `Version conflict — another admin acted on this report. Please refresh and try again.`
    )
  }
}

/**
 * Validate that a workflow state transition is allowed.
 * Throws failed-precondition if the transition is invalid.
 */
export function validateTransition(
  currentState: WorkflowState,
  targetState: WorkflowState,
  reportId: string
): void {
  if (!canTransition(currentState, targetState)) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `Cannot transition report from '${currentState}' to '${targetState}'. Invalid state transition.`
    )
  }
}
