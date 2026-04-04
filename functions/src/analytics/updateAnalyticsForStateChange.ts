import { WorkflowState, type IncidentType, type Severity } from '../types/report'
import type { AnalyticsSummaryCurrent, MunicipalityBreakdownEntry } from '../types/analytics'
import {
  buildScopeRefs,
  normalizeAnalyticsSnapshot,
} from './shared'

interface UpdateAnalyticsForStateChangePayload {
  reportId: string
  municipalityCode: string
  provinceCode: string
  barangayCode: string
  incidentType: IncidentType
  severity: Severity
  createdAt: string
  previousState: WorkflowState | null
  nextState: WorkflowState
  verifiedAt?: string | null
  resolvedAt?: string | null
  eventAt?: string
}

function minutesBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0
  }

  return Math.round((end - start) / 60000)
}

function ensureMunicipalityBreakdownEntry(
  entries: MunicipalityBreakdownEntry[],
  municipalityCode: string
): MunicipalityBreakdownEntry {
  let entry = entries.find((candidate) => candidate.municipalityCode === municipalityCode)

  if (!entry) {
    entry = {
      municipalityCode,
      total: 0,
      pending: 0,
      verified: 0,
      resolved: 0,
      rejected: 0,
    }
    entries.push(entry)
  }

  return entry
}

function adjustTrackedStateCounts(
  target: Pick<
    MunicipalityBreakdownEntry,
    'pending' | 'verified' | 'resolved' | 'rejected'
  >,
  previousState: WorkflowState | null,
  nextState: WorkflowState
) {
  const trackedKeyByState: Partial<
    Record<WorkflowState, keyof typeof target>
  > = {
    [WorkflowState.Pending]: 'pending',
    [WorkflowState.Verified]: 'verified',
    [WorkflowState.Resolved]: 'resolved',
    [WorkflowState.Rejected]: 'rejected',
  }

  if (previousState) {
    const previousKey = trackedKeyByState[previousState]
    if (previousKey) {
      target[previousKey] = Math.max(0, target[previousKey] - 1)
    }
  }

  const nextKey = trackedKeyByState[nextState]
  if (nextKey) {
    target[nextKey] += 1
  }
}

function sortHotspots(
  hotspots: AnalyticsSummaryCurrent['hotspots']
): AnalyticsSummaryCurrent['hotspots'] {
  return [...hotspots]
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count
      }

      return `${left.municipalityCode}-${left.barangayCode}`.localeCompare(
        `${right.municipalityCode}-${right.barangayCode}`
      )
    })
    .slice(0, 10)
}

function finalizeSnapshot(snapshot: AnalyticsSummaryCurrent, updatedAt: string) {
  snapshot.avgVerificationMinutes =
    snapshot.durationTotals.verificationCount > 0
      ? Number(
          (
            snapshot.durationTotals.verificationMinutesTotal /
            snapshot.durationTotals.verificationCount
          ).toFixed(2)
        )
      : 0

  snapshot.avgResolutionMinutes =
    snapshot.durationTotals.resolutionCount > 0
      ? Number(
          (
            snapshot.durationTotals.resolutionMinutesTotal /
            snapshot.durationTotals.resolutionCount
          ).toFixed(2)
        )
      : 0

  snapshot.hotspots = sortHotspots(snapshot.hotspots)
  snapshot.municipalityBreakdown = [...snapshot.municipalityBreakdown].sort((left, right) =>
    left.municipalityCode.localeCompare(right.municipalityCode)
  )
  snapshot.updatedAt = updatedAt

  return snapshot
}

function applyAnalyticsMutation(
  snapshot: AnalyticsSummaryCurrent,
  payload: UpdateAnalyticsForStateChangePayload,
  options: { includeMunicipalityBreakdown: boolean; updatedAt: string }
) {
  const isCreation = payload.previousState === null

  if (isCreation) {
    snapshot.byWorkflowState.total += 1
  }

  if (payload.previousState && payload.previousState !== payload.nextState) {
    snapshot.byWorkflowState[payload.previousState] = Math.max(
      0,
      snapshot.byWorkflowState[payload.previousState] - 1
    )
  }

  if (payload.previousState !== payload.nextState || isCreation) {
    snapshot.byWorkflowState[payload.nextState] += 1
  }

  if (isCreation) {
    snapshot.byType[payload.incidentType] =
      (snapshot.byType[payload.incidentType] ?? 0) + 1
    snapshot.bySeverity[payload.severity] =
      (snapshot.bySeverity[payload.severity] ?? 0) + 1

    const hotspot = snapshot.hotspots.find(
      (entry) =>
        entry.barangayCode === payload.barangayCode &&
        entry.municipalityCode === payload.municipalityCode
    )

    if (hotspot) {
      hotspot.count += 1
    } else {
      snapshot.hotspots.push({
        barangayCode: payload.barangayCode,
        municipalityCode: payload.municipalityCode,
        count: 1,
      })
    }
  }

  if (payload.nextState === WorkflowState.Verified) {
    const verificationMinutes = minutesBetween(
      payload.createdAt,
      payload.verifiedAt ?? options.updatedAt
    )

    if (verificationMinutes > 0) {
      snapshot.durationTotals.verificationMinutesTotal += verificationMinutes
      snapshot.durationTotals.verificationCount += 1
    }
  }

  if (payload.nextState === WorkflowState.Resolved) {
    const resolutionMinutes = minutesBetween(
      payload.createdAt,
      payload.resolvedAt ?? options.updatedAt
    )

    if (resolutionMinutes > 0) {
      snapshot.durationTotals.resolutionMinutesTotal += resolutionMinutes
      snapshot.durationTotals.resolutionCount += 1
    }
  }

  if (options.includeMunicipalityBreakdown) {
    const entry = ensureMunicipalityBreakdownEntry(
      snapshot.municipalityBreakdown,
      payload.municipalityCode
    )

    if (isCreation) {
      entry.total += 1
    }

    adjustTrackedStateCounts(entry, payload.previousState, payload.nextState)
  }

  return finalizeSnapshot(snapshot, options.updatedAt)
}

export async function updateAnalyticsForStateChange(
  tx: FirebaseFirestore.Transaction,
  db: FirebaseFirestore.Firestore,
  payload: UpdateAnalyticsForStateChangePayload
) {
  const updatedAt = payload.eventAt ?? new Date().toISOString()
  const refs = buildScopeRefs(
    db,
    payload.municipalityCode,
    payload.provinceCode,
    payload.createdAt
  )

  const snapshots = await Promise.all([
    tx.get(refs.municipality.summary),
    tx.get(refs.municipality.daily),
    tx.get(refs.province.summary),
    tx.get(refs.province.daily),
  ])

  const municipalitySummary = applyAnalyticsMutation(
    normalizeAnalyticsSnapshot(
      snapshots[0].data(),
      'municipality',
      payload.municipalityCode,
      'summary',
      'current'
    ),
    payload,
    { includeMunicipalityBreakdown: false, updatedAt }
  )

  const municipalityDaily = applyAnalyticsMutation(
    normalizeAnalyticsSnapshot(
      snapshots[1].data(),
      'municipality',
      payload.municipalityCode,
      'daily',
      refs.dayKey
    ),
    payload,
    { includeMunicipalityBreakdown: false, updatedAt }
  )

  const provinceSummary = applyAnalyticsMutation(
    normalizeAnalyticsSnapshot(
      snapshots[2].data(),
      'province',
      payload.provinceCode,
      'summary',
      'current'
    ),
    payload,
    { includeMunicipalityBreakdown: true, updatedAt }
  )

  const provinceDaily = applyAnalyticsMutation(
    normalizeAnalyticsSnapshot(
      snapshots[3].data(),
      'province',
      payload.provinceCode,
      'daily',
      refs.dayKey
    ),
    payload,
    { includeMunicipalityBreakdown: true, updatedAt }
  )

  tx.set(
    refs.municipality.root,
    {
      scopeType: 'municipality',
      scopeCode: payload.municipalityCode,
      updatedAt,
    },
    { merge: true }
  )
  tx.set(
    refs.province.root,
    {
      scopeType: 'province',
      scopeCode: payload.provinceCode,
      updatedAt,
    },
    { merge: true }
  )

  tx.set(refs.municipality.summary, municipalitySummary)
  tx.set(refs.municipality.daily, municipalityDaily)
  tx.set(refs.province.summary, provinceSummary)
  tx.set(refs.province.daily, provinceDaily)
}
