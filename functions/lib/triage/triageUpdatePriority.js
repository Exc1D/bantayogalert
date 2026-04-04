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
exports.triageUpdatePriority = void 0;
/**
 * triageUpdatePriority Cloud Function
 *
 * Sets priority (1-5) on a report without changing workflow state.
 * Non-state-change mutation with optimistic concurrency.
 */
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const zod_1 = require("zod");
const security_1 = require("../security");
const shared_1 = require("./shared");
const shared_2 = require("../audit/shared");
const UpdatePrioritySchema = zod_1.z.object({
    reportId: zod_1.z.string(),
    expectedVersion: zod_1.z.number(),
    priority: zod_1.z.number().int().min(1).max(5),
});
exports.triageUpdatePriority = functions.https.onCall(async (data, context) => {
    (0, security_1.validateAuthenticated)(context);
    const parsed = UpdatePrioritySchema.safeParse(data);
    if (!parsed.success) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parsed.error.issues);
    }
    const { reportId, expectedVersion, priority } = parsed.data;
    const db = (0, firestore_1.getFirestore)();
    await db.runTransaction(async (tx) => {
        const opsDoc = await tx.get(db.collection('report_ops').doc(reportId));
        if (!opsDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Report operations document not found');
        }
        const opsData = opsDoc.data();
        (0, shared_1.validateVersion)(opsData.version, expectedVersion, reportId);
        // Read report_private to get current priority for activity log
        const privateDoc = await tx.get(db.collection('report_private').doc(reportId));
        if (!privateDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Report private document not found');
        }
        const privateData = privateDoc.data();
        const previousPriority = privateData.priority;
        // Get municipalityCode from report_ops (written at submit time)
        const municipalityCode = opsData.municipalityCode;
        (0, security_1.validateMunicipalAdmin)(context, municipalityCode);
        const claims = context.auth.token;
        const now = new Date().toISOString();
        const entry = (0, shared_1.buildActivityEntry)('priority_updated', claims.uid, {
            previousPriority,
            newPriority: priority,
        });
        // This does NOT update reports/{id} — no workflowState change
        tx.update(db.collection('report_private').doc(reportId), {
            priority,
            activityLog: firestore_1.FieldValue.arrayUnion(entry),
        });
        tx.update(db.collection('report_ops').doc(reportId), {
            version: (opsData.version ?? 1) + 1,
            activity: firestore_1.FieldValue.arrayUnion(entry),
        });
        await (0, shared_2.appendAuditEntry)(tx, db, {
            entityType: 'report',
            entityId: reportId,
            action: 'triage_update_priority',
            actorUid: context.auth.uid,
            actorRole: claims.role ?? 'citizen',
            municipalityCode,
            provinceCode: 'CMN',
            createdAt: now,
            details: {
                previousPriority: previousPriority ?? null,
                newPriority: priority,
            },
        });
    });
    return { success: true };
});
