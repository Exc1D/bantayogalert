import { useQuery } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import type {
  AnalyticsBucketType,
  AnalyticsDurationTotals,
  AnalyticsSnapshot,
  HotspotCount,
  MunicipalityBreakdownEntry,
} from '@/types/analytics'

const PROVINCE_CODE = 'CMN'

export interface AnalyticsDateRange {
  preset: '7d' | '30d' | '90d' | 'custom'
  startDate: string
  endDate: string
}

export interface AnalyticsTimeSeriesPoint {
  bucketKey: string
  total: number
  pending: number
  verified: number
  resolved: number
  rejected: number
}

export interface AnalyticsQueryResult {
  current: AnalyticsSnapshot
  range: AnalyticsSnapshot
  dailyBuckets: AnalyticsSnapshot[]
  timeSeries: AnalyticsTimeSeriesPoint[]
}

function emptyDurationTotals(): AnalyticsDurationTotals {
  return {
    verificationMinutesTotal: 0,
    verificationCount: 0,
    resolutionMinutesTotal: 0,
    resolutionCount: 0,
  }
}

function createEmptySnapshot(
  scopeType: AnalyticsSnapshot['scopeType'],
  scopeCode: string,
  bucketType: AnalyticsBucketType,
  bucketKey: string
): AnalyticsSnapshot {
  return {
    scopeType,
    scopeCode,
    bucketType,
    bucketKey,
    byWorkflowState: {
      total: 0,
      pending: 0,
      verified: 0,
      rejected: 0,
      dispatched: 0,
      acknowledged: 0,
      in_progress: 0,
      resolved: 0,
    },
    byType: {},
    bySeverity: {},
    durationTotals: emptyDurationTotals(),
    avgVerificationMinutes: 0,
    avgResolutionMinutes: 0,
    hotspots: [],
    municipalityBreakdown: [],
    updatedAt: new Date(0).toISOString(),
  }
}

function normalizeSnapshot(
  source: Partial<AnalyticsSnapshot> | undefined,
  scopeType: AnalyticsSnapshot['scopeType'],
  scopeCode: string,
  bucketType: AnalyticsBucketType,
  bucketKey: string
): AnalyticsSnapshot {
  const base = createEmptySnapshot(scopeType, scopeCode, bucketType, bucketKey)

  return {
    ...base,
    ...source,
    scopeType,
    scopeCode,
    bucketType,
    bucketKey,
    byWorkflowState: {
      ...base.byWorkflowState,
      ...source?.byWorkflowState,
    },
    durationTotals: {
      ...base.durationTotals,
      ...source?.durationTotals,
    },
    hotspots: Array.isArray(source?.hotspots) ? source.hotspots : [],
    municipalityBreakdown: Array.isArray(source?.municipalityBreakdown)
      ? source.municipalityBreakdown
      : [],
    updatedAt:
      typeof source?.updatedAt === 'string' ? source.updatedAt : base.updatedAt,
  }
}

function mergeRecordValues(
  target: Record<string, number>,
  source: Record<string, number>
) {
  for (const [key, value] of Object.entries(source)) {
    target[key] = (target[key] ?? 0) + Number(value ?? 0)
  }
}

function mergeHotspots(target: HotspotCount[], source: HotspotCount[]) {
  for (const hotspot of source) {
    const existing = target.find(
      (entry) =>
        entry.barangayCode === hotspot.barangayCode &&
        entry.municipalityCode === hotspot.municipalityCode
    )

    if (existing) {
      existing.count += hotspot.count
    } else {
      target.push({ ...hotspot })
    }
  }
}

function mergeMunicipalityBreakdown(
  target: MunicipalityBreakdownEntry[],
  source: MunicipalityBreakdownEntry[]
) {
  for (const entry of source) {
    const existing = target.find(
      (candidate) => candidate.municipalityCode === entry.municipalityCode
    )

    if (existing) {
      existing.total += entry.total
      existing.pending += entry.pending
      existing.verified += entry.verified
      existing.resolved += entry.resolved
      existing.rejected += entry.rejected
    } else {
      target.push({ ...entry })
    }
  }
}

function aggregateSnapshots(
  buckets: AnalyticsSnapshot[],
  scopeType: AnalyticsSnapshot['scopeType'],
  scopeCode: string,
  bucketKey: string
): AnalyticsSnapshot {
  const aggregate = createEmptySnapshot(scopeType, scopeCode, 'summary', bucketKey)

  for (const bucket of buckets) {
    aggregate.byWorkflowState.total += bucket.byWorkflowState.total
    aggregate.byWorkflowState.pending += bucket.byWorkflowState.pending
    aggregate.byWorkflowState.verified += bucket.byWorkflowState.verified
    aggregate.byWorkflowState.rejected += bucket.byWorkflowState.rejected
    aggregate.byWorkflowState.dispatched += bucket.byWorkflowState.dispatched
    aggregate.byWorkflowState.acknowledged += bucket.byWorkflowState.acknowledged
    aggregate.byWorkflowState.in_progress += bucket.byWorkflowState.in_progress
    aggregate.byWorkflowState.resolved += bucket.byWorkflowState.resolved
    mergeRecordValues(aggregate.byType, bucket.byType as Record<string, number>)
    mergeRecordValues(
      aggregate.bySeverity,
      bucket.bySeverity as Record<string, number>
    )
    aggregate.durationTotals.verificationMinutesTotal +=
      bucket.durationTotals.verificationMinutesTotal
    aggregate.durationTotals.verificationCount +=
      bucket.durationTotals.verificationCount
    aggregate.durationTotals.resolutionMinutesTotal +=
      bucket.durationTotals.resolutionMinutesTotal
    aggregate.durationTotals.resolutionCount +=
      bucket.durationTotals.resolutionCount
    mergeHotspots(aggregate.hotspots, bucket.hotspots)
    mergeMunicipalityBreakdown(
      aggregate.municipalityBreakdown,
      bucket.municipalityBreakdown
    )

    if (bucket.updatedAt > aggregate.updatedAt) {
      aggregate.updatedAt = bucket.updatedAt
    }
  }

  aggregate.hotspots = aggregate.hotspots
    .sort((left, right) => right.count - left.count)
    .slice(0, 10)
  aggregate.municipalityBreakdown = aggregate.municipalityBreakdown.sort((left, right) =>
    left.municipalityCode.localeCompare(right.municipalityCode)
  )
  aggregate.avgVerificationMinutes =
    aggregate.durationTotals.verificationCount > 0
      ? Number(
          (
            aggregate.durationTotals.verificationMinutesTotal /
            aggregate.durationTotals.verificationCount
          ).toFixed(2)
        )
      : 0
  aggregate.avgResolutionMinutes =
    aggregate.durationTotals.resolutionCount > 0
      ? Number(
          (
            aggregate.durationTotals.resolutionMinutesTotal /
            aggregate.durationTotals.resolutionCount
          ).toFixed(2)
        )
      : 0

  return aggregate
}

function getRangeKey(dateRange: AnalyticsDateRange): string {
  return `${dateRange.preset}:${dateRange.startDate}:${dateRange.endDate}`
}

function buildAnalyticsPath(
  scopeType: AnalyticsSnapshot['scopeType'],
  scopeCode: string
) {
  return scopeType === 'province'
    ? ['analytics_province', PROVINCE_CODE] as const
    : ['analytics_municipality', scopeCode] as const
}

export const ANALYTICS_QUERY_KEY = (
  scopeType: AnalyticsSnapshot['scopeType'],
  scopeCode: string,
  rangeKey: string
) => ['analytics', scopeType, scopeCode, rangeKey] as const

export function useAnalytics(options: {
  scopeType: AnalyticsSnapshot['scopeType']
  scopeCode: string
  dateRange: AnalyticsDateRange
}) {
  const { scopeType, scopeCode, dateRange } = options
  const normalizedScopeCode = scopeType === 'province' ? PROVINCE_CODE : scopeCode

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEY(
      scopeType,
      normalizedScopeCode,
      getRangeKey(dateRange)
    ),
    enabled: Boolean(normalizedScopeCode),
    staleTime: 1000 * 60,
    queryFn: async (): Promise<AnalyticsQueryResult> => {
      const [collectionName, resolvedScopeCode] = buildAnalyticsPath(
        scopeType,
        normalizedScopeCode
      )
      const summaryRef = doc(
        db,
        collectionName,
        resolvedScopeCode,
        'summary',
        'current'
      )
      const dailyRef = collection(db, collectionName, resolvedScopeCode, 'daily')

      const [summarySnapshot, dailySnapshot] = await Promise.all([
        getDoc(summaryRef),
        getDocs(
          query(
            dailyRef,
            where('bucketKey', '>=', dateRange.startDate),
            where('bucketKey', '<=', dateRange.endDate),
            orderBy('bucketKey', 'asc')
          )
        ),
      ])

      const current = normalizeSnapshot(
        summarySnapshot.exists()
          ? (summarySnapshot.data() as Partial<AnalyticsSnapshot>)
          : undefined,
        scopeType,
        resolvedScopeCode,
        'summary',
        'current'
      )

      const dailyBuckets = dailySnapshot.docs.map((snapshot) =>
        normalizeSnapshot(
          snapshot.data() as Partial<AnalyticsSnapshot>,
          scopeType,
          resolvedScopeCode,
          'daily',
          snapshot.id
        )
      )

      const range = aggregateSnapshots(
        dailyBuckets,
        scopeType,
        resolvedScopeCode,
        `${dateRange.startDate}:${dateRange.endDate}`
      )

      return {
        current,
        range,
        dailyBuckets,
        timeSeries: dailyBuckets.map((bucket) => ({
          bucketKey: bucket.bucketKey,
          total: bucket.byWorkflowState.total,
          pending: bucket.byWorkflowState.pending,
          verified: bucket.byWorkflowState.verified,
          resolved: bucket.byWorkflowState.resolved,
          rejected: bucket.byWorkflowState.rejected,
        })),
      }
    },
  })
}
