import { WorkflowState } from './report'

export const VALID_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  [WorkflowState.Pending]: [WorkflowState.Verified, WorkflowState.Rejected],
  [WorkflowState.Verified]: [WorkflowState.Dispatched, WorkflowState.Rejected],
  [WorkflowState.Rejected]: [], // terminal
  [WorkflowState.Dispatched]: [WorkflowState.Acknowledged, WorkflowState.Dispatched], // can reroute
  [WorkflowState.Acknowledged]: [WorkflowState.InProgress],
  [WorkflowState.InProgress]: [WorkflowState.Resolved],
  [WorkflowState.Resolved]: [], // terminal
} as const

export function canTransition(from: WorkflowState, to: WorkflowState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}
