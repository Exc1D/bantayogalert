"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.triageInProgress = void 0;
/**
 * triageInProgress Cloud Function
 *
 * Transitions a report from acknowledged → in_progress.
 */
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const zod_1 = require("zod");
const security_1 = require("../security");
const shared_1 = require("./shared");
const status_1 = require("../types/status");
const report_1 = require("../types/report");
const updateAnalyticsForStateChange_1 = require("../analytics/updateAnalyticsForStateChange");
const shared_2 = require("../audit/shared");
const InProgressSchema = zod_1.z.object({
    reportId: zod_1.z.string(),
    expectedVersion: zod_1.z.number(),
});
exports.triageInProgress = functions.https.onCall(async (data, context) => {
    (0, security_1.validateAuthenticated)(context);
    const parsed = InProgressSchema.safeParse(data);
    if (!parsed.success) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parsed.error.issues);
    }
    const { reportId, expectedVersion } = parsed.data;
    const db = (0, firestore_1.getFirestore)();
    await db.runTransaction(async (tx) => {
        const opsDoc = await tx.get(db.collection('report_ops').doc(reportId));
        if (!opsDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Report operations document not found');
        }
        const opsData = opsDoc.data();
        (0, shared_1.validateVersion)(opsData.version, expectedVersion, reportId);
        const reportDoc = await tx.get(db.collection('reports').doc(reportId));
        if (!reportDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Report not found');
        }
        const reportData = reportDoc.data();
        const currentState = reportData.workflowState;
        const municipalityCode = reportData.municipalityCode;
        (0, security_1.validateMunicipalAdmin)(context, municipalityCode);
        (0, shared_1.validateTransition)(currentState, report_1.WorkflowState.InProgress, reportId);
        const claims = context.auth.token;
        const now = new Date().toISOString();
        const entry = (0, shared_1.buildActivityEntry)('in_progress', claims.uid);
        tx.update(db.collection('reports').doc(reportId), {
            workflowState: report_1.WorkflowState.InProgress,
            updatedAt: now,
        });
        tx.update(db.collection('report_private').doc(reportId), {
            ownerStatus: status_1.WORKFLOW_TO_OWNER_STATUS[report_1.WorkflowState.InProgress],
            activityLog: firestore_1.FieldValue.arrayUnion(entry),
        });
        tx.update(db.collection('report_ops').doc(reportId), {
            version: (opsData.version ?? 1) + 1,
            activity: firestore_1.FieldValue.arrayUnion(entry),
        });
        await (0, updateAnalyticsForStateChange_1.updateAnalyticsForStateChange)(tx, db, {
            reportId,
            municipalityCode,
            provinceCode: 'CMN',
            barangayCode: reportData.barangayCode,
            incidentType: reportData.type,
            severity: reportData.severity,
            createdAt: reportData.createdAt,
            previousState: currentState,
            nextState: report_1.WorkflowState.InProgress,
            eventAt: now,
        });
        await (0, shared_2.appendAuditEntry)(tx, db, {
            entityType: 'report',
            entityId: reportId,
            action: 'triage_in_progress',
            actorUid: context.auth.uid,
            actorRole: claims.role ?? 'citizen',
            municipalityCode,
            provinceCode: 'CMN',
            createdAt: now,
            details: {
                fromState: currentState,
                toState: report_1.WorkflowState.InProgress,
            },
        });
    });
    return { success: true };
});
