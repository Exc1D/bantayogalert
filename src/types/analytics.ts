import type { IncidentType, Severity, WorkflowState } from './report'

export type AnalyticsScopeType = 'municipality' | 'province'
export type AnalyticsBucketType = 'summary' | 'daily' | 'weekly' | 'monthly'

export interface AnalyticsWorkflowCounts {
  total: number
  pending: number
  verified: number
  rejected: number
  dispatched: number
  acknowledged: number
  in_progress: number
  resolved: number
}

export type AnalyticsTypeBreakdown = Partial<Record<IncidentType, number>>
export type AnalyticsSeverityBreakdown = Partial<Record<Severity, number>>
export type AnalyticsWorkflowBreakdown = Partial<Record<WorkflowState, number>>

export interface AnalyticsDurationTotals {
  verificationMinutesTotal: number
  verificationCount: number
  resolutionMinutesTotal: number
  resolutionCount: number
}

export interface HotspotCount {
  barangayCode: string
  municipalityCode: string
  count: number
}

export interface MunicipalityBreakdownEntry {
  municipalityCode: string
  total: number
  pending: number
  verified: number
  resolved: number
  rejected: number
}

export interface AnalyticsSnapshot {
  scopeType: AnalyticsScopeType
  scopeCode: string
  bucketKey: string
  bucketType: AnalyticsBucketType
  byWorkflowState: AnalyticsWorkflowCounts
  byType: AnalyticsTypeBreakdown
  bySeverity: AnalyticsSeverityBreakdown
  durationTotals: AnalyticsDurationTotals
  avgVerificationMinutes: number
  avgResolutionMinutes: number
  hotspots: HotspotCount[]
  municipalityBreakdown: MunicipalityBreakdownEntry[]
  updatedAt: string
}
