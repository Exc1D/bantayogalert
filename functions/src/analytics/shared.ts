import { FieldValue } from 'firebase-admin/firestore'
import type {
  AnalyticsBucketType,
  AnalyticsDurationTotals,
  AnalyticsSummaryCurrent,
  AnalyticsWorkflowCounts,
  HotspotCount,
  MunicipalityBreakdownEntry,
} from '../types/analytics'
import type { WorkflowState } from '../types/report'

export const ANALYTICS_PROVINCE_CODE = 'CMN'
export const ANALYTICS_TIME_ZONE = 'Asia/Manila'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function getTimeZoneParts(dateIso: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ANALYTICS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(dateIso))

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  }
}

function getUtcDateFromParts(dateIso: string): Date {
  const { year, month, day } = getTimeZoneParts(dateIso)
  return new Date(Date.UTC(year, month - 1, day))
}

export function getDayKey(dateIso: string): string {
  const { year, month, day } = getTimeZoneParts(dateIso)
  return `${year}-${pad(month)}-${pad(day)}`
}

export function getWeekKey(dateIso: string): string {
  const date = getUtcDateFromParts(dateIso)
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-${pad(weekNo)}`
}

export function getMonthKey(dateIso: string): string {
  const { year, month } = getTimeZoneParts(dateIso)
  return `${year}-${pad(month)}`
}

export function createEmptyWorkflowCounts(): AnalyticsWorkflowCounts {
  return {
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    dispatched: 0,
    acknowledged: 0,
    in_progress: 0,
    resolved: 0,
  }
}

export function createEmptyDurationTotals(): AnalyticsDurationTotals {
  return {
    verificationMinutesTotal: 0,
    verificationCount: 0,
    resolutionMinutesTotal: 0,
    resolutionCount: 0,
  }
}

function normalizeWorkflowCounts(
  source?: Partial<AnalyticsWorkflowCounts>
): AnalyticsWorkflowCounts {
  const base = createEmptyWorkflowCounts()
  return {
    total: Number(source?.total ?? base.total),
    pending: Number(source?.pending ?? base.pending),
    verified: Number(source?.verified ?? base.verified),
    rejected: Number(source?.rejected ?? base.rejected),
    dispatched: Number(source?.dispatched ?? base.dispatched),
    acknowledged: Number(source?.acknowledged ?? base.acknowledged),
    in_progress: Number(source?.in_progress ?? base.in_progress),
    resolved: Number(source?.resolved ?? base.resolved),
  }
}

function normalizeDurationTotals(
  source?: Partial<AnalyticsDurationTotals>
): AnalyticsDurationTotals {
  const base = createEmptyDurationTotals()
  return {
    verificationMinutesTotal: Number(
      source?.verificationMinutesTotal ?? base.verificationMinutesTotal
    ),
    verificationCount: Number(source?.verificationCount ?? base.verificationCount),
    resolutionMinutesTotal: Number(
      source?.resolutionMinutesTotal ?? base.resolutionMinutesTotal
    ),
    resolutionCount: Number(source?.resolutionCount ?? base.resolutionCount),
  }
}

function normalizeHotspots(source?: HotspotCount[]): HotspotCount[] {
  if (!Array.isArray(source)) {
    return []
  }

  return source
    .filter(
      (entry) =>
        typeof entry?.barangayCode === 'string' &&
        typeof entry?.municipalityCode === 'string'
    )
    .map((entry) => ({
      barangayCode: entry.barangayCode,
      municipalityCode: entry.municipalityCode,
      count: Number(entry.count ?? 0),
    }))
}

function normalizeMunicipalityBreakdown(
  source?: MunicipalityBreakdownEntry[]
): MunicipalityBreakdownEntry[] {
  if (!Array.isArray(source)) {
    return []
  }

  return source
    .filter((entry) => typeof entry?.municipalityCode === 'string')
    .map((entry) => ({
      municipalityCode: entry.municipalityCode,
      total: Number(entry.total ?? 0),
      pending: Number(entry.pending ?? 0),
      verified: Number(entry.verified ?? 0),
      resolved: Number(entry.resolved ?? 0),
      rejected: Number(entry.rejected ?? 0),
    }))
}

export function createEmptyAnalyticsSnapshot(
  scopeType: AnalyticsSummaryCurrent['scopeType'],
  scopeCode: string,
  bucketType: AnalyticsBucketType,
  bucketKey: string
): AnalyticsSummaryCurrent {
  return {
    scopeType,
    scopeCode,
    bucketType,
    bucketKey,
    byWorkflowState: createEmptyWorkflowCounts(),
    byType: {},
    bySeverity: {},
    durationTotals: createEmptyDurationTotals(),
    avgVerificationMinutes: 0,
    avgResolutionMinutes: 0,
    hotspots: [],
    municipalityBreakdown: [],
    updatedAt: new Date(0).toISOString(),
  }
}

export function normalizeAnalyticsSnapshot(
  source: Partial<AnalyticsSummaryCurrent> | undefined,
  scopeType: AnalyticsSummaryCurrent['scopeType'],
  scopeCode: string,
  bucketType: AnalyticsBucketType,
  bucketKey: string
): AnalyticsSummaryCurrent {
  const base = createEmptyAnalyticsSnapshot(scopeType, scopeCode, bucketType, bucketKey)

  return {
    ...base,
    scopeType,
    scopeCode,
    bucketType,
    bucketKey,
    byWorkflowState: normalizeWorkflowCounts(source?.byWorkflowState),
    byType: source?.byType ?? {},
    bySeverity: source?.bySeverity ?? {},
    durationTotals: normalizeDurationTotals(source?.durationTotals),
    avgVerificationMinutes: Number(source?.avgVerificationMinutes ?? 0),
    avgResolutionMinutes: Number(source?.avgResolutionMinutes ?? 0),
    hotspots: normalizeHotspots(source?.hotspots),
    municipalityBreakdown: normalizeMunicipalityBreakdown(source?.municipalityBreakdown),
    updatedAt:
      typeof source?.updatedAt === 'string' ? source.updatedAt : base.updatedAt,
  }
}

export function buildScopeRefs(
  db: FirebaseFirestore.Firestore,
  municipalityCode: string,
  provinceCode: string,
  createdAtIso: string
) {
  const dayKey = getDayKey(createdAtIso)
  const weekKey = getWeekKey(createdAtIso)
  const monthKey = getMonthKey(createdAtIso)

  const municipalityRoot = db.collection('analytics_municipality').doc(municipalityCode)
  const provinceRoot = db.collection('analytics_province').doc(provinceCode)

  return {
    municipality: {
      root: municipalityRoot,
      summary: municipalityRoot.collection('summary').doc('current'),
      daily: municipalityRoot.collection('daily').doc(dayKey),
      weekly: municipalityRoot.collection('weekly').doc(weekKey),
      monthly: municipalityRoot.collection('monthly').doc(monthKey),
    },
    province: {
      root: provinceRoot,
      summary: provinceRoot.collection('summary').doc('current'),
      daily: provinceRoot.collection('daily').doc(dayKey),
      weekly: provinceRoot.collection('weekly').doc(weekKey),
      monthly: provinceRoot.collection('monthly').doc(monthKey),
    },
    dayKey,
    weekKey,
    monthKey,
  }
}

export function buildWorkflowDelta(
  previousState: WorkflowState | null,
  nextState: WorkflowState | null
): Record<string, FirebaseFirestore.FieldValue> {
  const delta: Record<string, FirebaseFirestore.FieldValue> = {}

  if (previousState === null && nextState !== null) {
    delta['byWorkflowState.total'] = FieldValue.increment(1)
  }

  if (previousState && previousState !== nextState) {
    delta[`byWorkflowState.${previousState}`] = FieldValue.increment(-1)
  }

  if (nextState && previousState !== nextState) {
    delta[`byWorkflowState.${nextState}`] = FieldValue.increment(1)
  }

  return delta
}
