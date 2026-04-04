import { ReportStatus, WorkflowState } from './report'

export const WORKFLOW_TO_OWNER_STATUS: Record<WorkflowState, ReportStatus> = {
  [WorkflowState.Pending]: ReportStatus.Submitted,
  [WorkflowState.Verified]: ReportStatus.Verified,
  [WorkflowState.Rejected]: ReportStatus.Rejected,
  [WorkflowState.Dispatched]: ReportStatus.Dispatched,
  [WorkflowState.Acknowledged]: ReportStatus.Acknowledged,
  [WorkflowState.InProgress]: ReportStatus.InProgress,
  [WorkflowState.Resolved]: ReportStatus.Resolved,
}

export const WORKFLOW_TO_PUBLIC_STATUS: Record<WorkflowState, string> = {
  [WorkflowState.Pending]: 'Pending Verification',
  [WorkflowState.Verified]: 'Verified',
  [WorkflowState.Rejected]: 'Resolved',
  [WorkflowState.Dispatched]: 'Verified',
  [WorkflowState.Acknowledged]: 'Verified',
  [WorkflowState.InProgress]: 'Verified',
  [WorkflowState.Resolved]: 'Resolved',
}
