/**
 * Workflow state machine types for Cloud Functions (Node runtime).
 * Mirrors src/types/workflow.ts — duplicated here because functions cannot import from src/
 */
import { WorkflowState } from './report'

export const VALID_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  [WorkflowState.Pending]: [WorkflowState.Verified, WorkflowState.Rejected],
  [WorkflowState.Verified]: [WorkflowState.Dispatched, WorkflowState.Rejected],
  [WorkflowState.Rejected]: [],
  [WorkflowState.Dispatched]: [WorkflowState.Acknowledged, WorkflowState.Dispatched],
  [WorkflowState.Acknowledged]: [WorkflowState.InProgress],
  [WorkflowState.InProgress]: [WorkflowState.Resolved],
  [WorkflowState.Resolved]: [],
} as const

export function canTransition(from: WorkflowState, to: WorkflowState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}
