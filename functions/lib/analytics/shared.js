"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYTICS_TIME_ZONE = exports.ANALYTICS_PROVINCE_CODE = void 0;
exports.getDayKey = getDayKey;
exports.getWeekKey = getWeekKey;
exports.getMonthKey = getMonthKey;
exports.createEmptyWorkflowCounts = createEmptyWorkflowCounts;
exports.createEmptyDurationTotals = createEmptyDurationTotals;
exports.createEmptyAnalyticsSnapshot = createEmptyAnalyticsSnapshot;
exports.normalizeAnalyticsSnapshot = normalizeAnalyticsSnapshot;
exports.buildScopeRefs = buildScopeRefs;
exports.buildWorkflowDelta = buildWorkflowDelta;
const firestore_1 = require("firebase-admin/firestore");
exports.ANALYTICS_PROVINCE_CODE = 'CMN';
exports.ANALYTICS_TIME_ZONE = 'Asia/Manila';
function pad(value) {
    return String(value).padStart(2, '0');
}
function getTimeZoneParts(dateIso) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: exports.ANALYTICS_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date(dateIso));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return {
        year: Number(values.year),
        month: Number(values.month),
        day: Number(values.day),
    };
}
function getUtcDateFromParts(dateIso) {
    const { year, month, day } = getTimeZoneParts(dateIso);
    return new Date(Date.UTC(year, month - 1, day));
}
function getDayKey(dateIso) {
    const { year, month, day } = getTimeZoneParts(dateIso);
    return `${year}-${pad(month)}-${pad(day)}`;
}
function getWeekKey(dateIso) {
    const date = getUtcDateFromParts(dateIso);
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-${pad(weekNo)}`;
}
function getMonthKey(dateIso) {
    const { year, month } = getTimeZoneParts(dateIso);
    return `${year}-${pad(month)}`;
}
function createEmptyWorkflowCounts() {
    return {
        total: 0,
        pending: 0,
        verified: 0,
        rejected: 0,
        dispatched: 0,
        acknowledged: 0,
        in_progress: 0,
        resolved: 0,
    };
}
function createEmptyDurationTotals() {
    return {
        verificationMinutesTotal: 0,
        verificationCount: 0,
        resolutionMinutesTotal: 0,
        resolutionCount: 0,
    };
}
function normalizeWorkflowCounts(source) {
    const base = createEmptyWorkflowCounts();
    return {
        total: Number(source?.total ?? base.total),
        pending: Number(source?.pending ?? base.pending),
        verified: Number(source?.verified ?? base.verified),
        rejected: Number(source?.rejected ?? base.rejected),
        dispatched: Number(source?.dispatched ?? base.dispatched),
        acknowledged: Number(source?.acknowledged ?? base.acknowledged),
        in_progress: Number(source?.in_progress ?? base.in_progress),
        resolved: Number(source?.resolved ?? base.resolved),
    };
}
function normalizeDurationTotals(source) {
    const base = createEmptyDurationTotals();
    return {
        verificationMinutesTotal: Number(source?.verificationMinutesTotal ?? base.verificationMinutesTotal),
        verificationCount: Number(source?.verificationCount ?? base.verificationCount),
        resolutionMinutesTotal: Number(source?.resolutionMinutesTotal ?? base.resolutionMinutesTotal),
        resolutionCount: Number(source?.resolutionCount ?? base.resolutionCount),
    };
}
function normalizeHotspots(source) {
    if (!Array.isArray(source)) {
        return [];
    }
    return source
        .filter((entry) => typeof entry?.barangayCode === 'string' &&
        typeof entry?.municipalityCode === 'string')
        .map((entry) => ({
        barangayCode: entry.barangayCode,
        municipalityCode: entry.municipalityCode,
        count: Number(entry.count ?? 0),
    }));
}
function normalizeMunicipalityBreakdown(source) {
    if (!Array.isArray(source)) {
        return [];
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
    }));
}
function createEmptyAnalyticsSnapshot(scopeType, scopeCode, bucketType, bucketKey) {
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
    };
}
function normalizeAnalyticsSnapshot(source, scopeType, scopeCode, bucketType, bucketKey) {
    const base = createEmptyAnalyticsSnapshot(scopeType, scopeCode, bucketType, bucketKey);
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
        updatedAt: typeof source?.updatedAt === 'string' ? source.updatedAt : base.updatedAt,
    };
}
function buildScopeRefs(db, municipalityCode, provinceCode, createdAtIso) {
    const dayKey = getDayKey(createdAtIso);
    const weekKey = getWeekKey(createdAtIso);
    const monthKey = getMonthKey(createdAtIso);
    const municipalityRoot = db.collection('analytics_municipality').doc(municipalityCode);
    const provinceRoot = db.collection('analytics_province').doc(provinceCode);
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
    };
}
function buildWorkflowDelta(previousState, nextState) {
    const delta = {};
    if (previousState === null && nextState !== null) {
        delta['byWorkflowState.total'] = firestore_1.FieldValue.increment(1);
    }
    if (previousState && previousState !== nextState) {
        delta[`byWorkflowState.${previousState}`] = firestore_1.FieldValue.increment(-1);
    }
    if (nextState && previousState !== nextState) {
        delta[`byWorkflowState.${nextState}`] = firestore_1.FieldValue.increment(1);
    }
    return delta;
}
