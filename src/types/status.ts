import { WorkflowState, ReportStatus } from './report'

// O(1) lookup — indexed by WorkflowState ordinal
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
  [WorkflowState.Rejected]: 'Resolved',  // rejected reports show as resolved to public
  [WorkflowState.Dispatched]: 'Verified',
  [WorkflowState.Acknowledged]: 'Verified',
  [WorkflowState.InProgress]: 'Verified',
  [WorkflowState.Resolved]: 'Resolved',
}

export const OWNER_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.Submitted]: 'Submitted',
  [ReportStatus.UnderReview]: 'Under Review',
  [ReportStatus.Verified]: 'Verified',
  [ReportStatus.Rejected]: 'Rejected',
  [ReportStatus.Dispatched]: 'Dispatched',
  [ReportStatus.Acknowledged]: 'Responder Acknowledged',
  [ReportStatus.InProgress]: 'In Progress',
  [ReportStatus.Resolved]: 'Resolved',
}
