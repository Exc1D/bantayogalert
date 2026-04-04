import { getFirestore } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import type { AnalyticsSummaryCurrent } from '../types/analytics'
import {
  ANALYTICS_TIME_ZONE,
  getMonthKey,
  getWeekKey,
  normalizeAnalyticsSnapshot,
} from './shared'

function mergeRecordValues(
  target: Record<string, number>,
  source: Record<string, number>
) {
  for (const [key, value] of Object.entries(source)) {
    target[key] = (target[key] ?? 0) + Number(value ?? 0)
  }
}

function mergeHotspots(
  target: AnalyticsSummaryCurrent['hotspots'],
  source: AnalyticsSummaryCurrent['hotspots']
) {
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
  target: AnalyticsSummaryCurrent['municipalityBreakdown'],
  source: AnalyticsSummaryCurrent['municipalityBreakdown']
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

function createAggregateBucket(
  source: AnalyticsSummaryCurrent[],
  scopeType: AnalyticsSummaryCurrent['scopeType'],
  scopeCode: string,
  bucketType: AnalyticsSummaryCurrent['bucketType'],
  bucketKey: string
) {
  const aggregate = normalizeAnalyticsSnapshot(
    undefined,
    scopeType,
    scopeCode,
    bucketType,
    bucketKey
  )

  for (const snapshot of source) {
    aggregate.byWorkflowState.total += snapshot.byWorkflowState.total
    aggregate.byWorkflowState.pending += snapshot.byWorkflowState.pending
    aggregate.byWorkflowState.verified += snapshot.byWorkflowState.verified
    aggregate.byWorkflowState.rejected += snapshot.byWorkflowState.rejected
    aggregate.byWorkflowState.dispatched += snapshot.byWorkflowState.dispatched
    aggregate.byWorkflowState.acknowledged += snapshot.byWorkflowState.acknowledged
    aggregate.byWorkflowState.in_progress += snapshot.byWorkflowState.in_progress
    aggregate.byWorkflowState.resolved += snapshot.byWorkflowState.resolved
    mergeRecordValues(aggregate.byType, snapshot.byType as Record<string, number>)
    mergeRecordValues(
      aggregate.bySeverity,
      snapshot.bySeverity as Record<string, number>
    )
    aggregate.durationTotals.verificationMinutesTotal +=
      snapshot.durationTotals.verificationMinutesTotal
    aggregate.durationTotals.verificationCount +=
      snapshot.durationTotals.verificationCount
    aggregate.durationTotals.resolutionMinutesTotal +=
      snapshot.durationTotals.resolutionMinutesTotal
    aggregate.durationTotals.resolutionCount +=
      snapshot.durationTotals.resolutionCount
    mergeHotspots(aggregate.hotspots, snapshot.hotspots)
    mergeMunicipalityBreakdown(
      aggregate.municipalityBreakdown,
      snapshot.municipalityBreakdown
    )

    if (snapshot.updatedAt > aggregate.updatedAt) {
      aggregate.updatedAt = snapshot.updatedAt
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

async function rollupScopeCollection(
  collectionName: 'analytics_municipality' | 'analytics_province',
  scopeType: AnalyticsSummaryCurrent['scopeType']
) {
  const db = getFirestore()
  const scopeSnapshot = await db.collection(collectionName).get()

  for (const scopeDoc of scopeSnapshot.docs) {
    const dailySnapshot = await scopeDoc.ref.collection('daily').get()
    const dailyBuckets = dailySnapshot.docs.map((doc) =>
      normalizeAnalyticsSnapshot(
        doc.data(),
        scopeType,
        scopeDoc.id,
        'daily',
        doc.id
      )
    )

    const weekly = new Map<string, AnalyticsSummaryCurrent[]>()
    const monthly = new Map<string, AnalyticsSummaryCurrent[]>()

    for (const bucket of dailyBuckets) {
      const weekKey = getWeekKey(bucket.bucketKey)
      const monthKey = getMonthKey(bucket.bucketKey)

      weekly.set(weekKey, [...(weekly.get(weekKey) ?? []), bucket])
      monthly.set(monthKey, [...(monthly.get(monthKey) ?? []), bucket])
    }

    const batch = db.batch()
    let hasWrites = false

    for (const [weekKey, buckets] of weekly.entries()) {
      batch.set(
        scopeDoc.ref.collection('weekly').doc(weekKey),
        createAggregateBucket(buckets, scopeType, scopeDoc.id, 'weekly', weekKey)
      )
      hasWrites = true
    }

    for (const [monthKey, buckets] of monthly.entries()) {
      batch.set(
        scopeDoc.ref.collection('monthly').doc(monthKey),
        createAggregateBucket(buckets, scopeType, scopeDoc.id, 'monthly', monthKey)
      )
      hasWrites = true
    }

    const summaryRef = scopeDoc.ref.collection('summary').doc('current')
    const summarySnapshot = await summaryRef.get()
    if (summarySnapshot.exists) {
      const summary = normalizeAnalyticsSnapshot(
        summarySnapshot.data(),
        scopeType,
        scopeDoc.id,
        'summary',
        'current'
      )

      batch.set(
        summaryRef,
        {
          ...summary,
          hotspots: [...summary.hotspots]
            .sort((left, right) => right.count - left.count)
            .slice(0, 10),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )
      hasWrites = true
    }

    if (hasWrites) {
      await batch.commit()
    }
  }
}

export const scheduledAggregation = onSchedule(
  {
    schedule: '0 2 * * *',
    timeZone: ANALYTICS_TIME_ZONE,
  },
  async () => {
    await rollupScopeCollection('analytics_municipality', 'municipality')
    await rollupScopeCollection('analytics_province', 'province')
  }
)
