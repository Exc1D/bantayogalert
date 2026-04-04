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
exports.triageReroute = void 0;
/**
 * triageReroute Cloud Function
 *
 * Updates the assigned contact on a dispatched or in_progress report.
 * Does NOT change workflowState — only updates assignedContactSnapshot and related fields.
 * Only allowed on reports that are dispatched or in_progress.
 */
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const zod_1 = require("zod");
const security_1 = require("../security");
const shared_1 = require("./shared");
const report_1 = require("../types/report");
const RerouteSchema = zod_1.z.object({
    reportId: zod_1.z.string(),
    expectedVersion: zod_1.z.number(),
    contactId: zod_1.z.string(),
    routingDestination: zod_1.z.string().optional(),
    dispatchNotes: zod_1.z.string().optional(),
});
const REROUTE_ALLOWED_STATES = [
    report_1.WorkflowState.Dispatched,
    report_1.WorkflowState.InProgress,
];
exports.triageReroute = functions.https.onCall(async (data, context) => {
    (0, security_1.validateAuthenticated)(context);
    const parsed = RerouteSchema.safeParse(data);
    if (!parsed.success) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parsed.error.issues);
    }
    const { reportId, expectedVersion, contactId, routingDestination, dispatchNotes } = parsed.data;
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
        // Validate: report must be dispatched or in_progress
        if (!REROUTE_ALLOWED_STATES.includes(currentState)) {
            throw new functions.https.HttpsError('failed-precondition', `Cannot reroute a report in '${currentState}' state. Only dispatched or in_progress reports can be rerouted.`);
        }
        // Fetch the contact to build new ContactSnapshot
        const contactDoc = await tx.get(db.collection('contacts').doc(contactId));
        if (!contactDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Contact not found');
        }
        const contactData = contactDoc.data();
        // Get previous contact info for activity log
        const previousContactId = opsData.assignedContactId;
        const snapshot = {
            contactId: contactData.id ?? contactId,
            name: contactData.name,
            agency: contactData.agency,
            type: contactData.type,
            phones: contactData.phones ?? [],
            email: contactData.email,
            municipalityCode: contactData.municipalityCode,
        };
        const claims = context.auth.token;
        const entry = (0, shared_1.buildActivityEntry)('rerouted', claims.uid, {
            previousContactId,
            newContactId: contactId,
            routingDestination,
            dispatchNotes,
        });
        // Note: This is the only triage CF that does NOT update reports/{id}
        // It only updates report_private and report_ops
        tx.update(db.collection('report_private').doc(reportId), {
            activityLog: firestore_1.FieldValue.arrayUnion(entry),
        });
        tx.update(db.collection('report_ops').doc(reportId), {
            version: (opsData.version ?? 1) + 1,
            assignedContactSnapshot: snapshot,
            assignedContactId: contactId,
            routingDestination: routingDestination ?? null,
            dispatchNotes: dispatchNotes ?? null,
            activity: firestore_1.FieldValue.arrayUnion(entry),
        });
    });
    return { success: true };
});
