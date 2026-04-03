import { describe, it, expect } from 'vitest'
import { WORKFLOW_TO_OWNER_STATUS } from '@/types/status'
import { WorkflowState, ReportStatus } from '@/types/report'

// RPT-11: Owner status label
describe('WORKFLOW_TO_OWNER_STATUS mapping', () => {
  it('maps pending to "Submitted"', () => {
    const status = WORKFLOW_TO_OWNER_STATUS[WorkflowState.Pending]
    expect(status).toBe(ReportStatus.Submitted)
  })

  it('maps verified to "Verified"', () => {
    const status = WORKFLOW_TO_OWNER_STATUS[WorkflowState.Verified]
    expect(status).toBe(ReportStatus.Verified)
  })

  it('maps all workflow states to owner statuses', () => {
    Object.values(WorkflowState).forEach((state) => {
      expect(WORKFLOW_TO_OWNER_STATUS[state]).toBeDefined()
    })
  })
})
