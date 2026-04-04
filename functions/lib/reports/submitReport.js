"use strict";
/**
 * submitReport Cloud Function
 *
 * Callable CF that creates three Firestore documents atomically:
 * - reports/{reportId}: public document with geohash location, workflowState=pending
 * - report_private/{reportId}: exact location, reporter info, ownerStatus=submitted
 * - report_ops/{reportId}: empty initial document for admin operations
 *
 * Input validation (Zod):
 * - type, severity: enums
 * - description: 10-2000 chars
 * - municipalityCode: 3-4 chars
 * - barangayCode: 6-7 chars
 * - exactLocation: lat 13.8-14.8, lng 122.3-123.3
 * - mediaUrls: max 5 URLs
 */
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
exports.submitReport = void 0;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const zod_1 = require("zod");
// ngeohash - using require to avoid type declaration issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ngeohash = require('ngeohash');
const security_1 = require("../security");
// User role values - matching the const in auth/claims.ts
const CITIZEN_ROLE = 'citizen';
// Input validation schema
const SubmitReportDataSchema = zod_1.z.object({
    type: zod_1.z.enum(['flood', 'landslide', 'fire', 'earthquake', 'medical', 'vehicle_accident', 'crime', 'other']),
    severity: zod_1.z.enum(['critical', 'high', 'medium', 'low']),
    description: zod_1.z.string().min(10).max(2000),
    municipalityCode: zod_1.z.string().min(3).max(4),
    barangayCode: zod_1.z.string().min(6).max(7),
    exactLocation: zod_1.z.object({
        lat: zod_1.z.number().min(13.8).max(14.8),
        lng: zod_1.z.number().min(122.3).max(123.3),
    }),
    mediaUrls: zod_1.z.array(zod_1.z.string().url()).max(5).default([]),
    // Optional reportId - if provided, use it (for media-first upload pattern)
    reportId: zod_1.z.string().optional(),
});
// Note: Using v1-style functions.https.onCall to match existing codebase pattern
// which mixes v1/v2 SDK. Type errors here are consistent with existing codebase.
exports.submitReport = functions.https.onCall(async (data, context) => {
    // 1. Validate authentication
    (0, security_1.validateAuthenticated)(context);
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email || '';
    const userName = context.auth.token.name || '';
    // 2. Validate role is citizen
    const role = context.auth.token.role;
    if (role !== CITIZEN_ROLE) {
        throw new functions.https.HttpsError('permission-denied', 'Only citizens can submit reports');
    }
    // 3. Parse and validate input data
    const parsedData = SubmitReportDataSchema.safeParse(data);
    if (!parsedData.success) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid report data', { errors: parsedData.error.issues });
    }
    const { type, severity, description, municipalityCode, barangayCode, exactLocation, mediaUrls, reportId: providedReportId } = parsedData.data;
    // 4. Rate limit check
    const rateLimitResult = await (0, security_1.checkRateLimit)(userId);
    if (!rateLimitResult.allowed) {
        throw new functions.https.HttpsError('resource-exhausted', 'Report rate limit exceeded. Please try again later.', {
            remaining: rateLimitResult.remaining,
            resetAt: rateLimitResult.resetAt.toISOString(),
        });
    }
    // 5. Sanitize text input
    const sanitizedData = (0, security_1.sanitizeReportInput)({
        type,
        severity,
        description,
        municipalityCode,
        barangayCode,
        mediaUrls,
    });
    // 6. Compute geohash for public location (9-char precision)
    const geohash = ngeohash.encode(exactLocation.lat, exactLocation.lng, 9);
    const db = (0, firestore_1.getFirestore)();
    // Use provided reportId or generate a new one
    const reportId = providedReportId ?? db.collection('reports').doc().id;
    const reportRef = db.collection('reports').doc(reportId);
    const now = new Date().toISOString();
    // 7. Atomic transaction: create all three documents
    await db.runTransaction(async (tx) => {
        // reports/{reportId}: public document
        tx.set(reportRef, {
            id: reportId,
            type: sanitizedData.type,
            severity: sanitizedData.severity,
            description: sanitizedData.description,
            location: {
                lat: exactLocation.lat,
                lng: exactLocation.lng,
                geohash,
            },
            municipalityCode: sanitizedData.municipalityCode,
            barangayCode: sanitizedData.barangayCode,
            mediaUrls: sanitizedData.mediaUrls,
            createdAt: now,
            updatedAt: now,
            reporterId: userId,
            workflowState: 'pending',
            verified: false,
        });
        // report_private/{reportId}: owner document with exact location
        const reportPrivateRef = db.collection('report_private').doc(reportId);
        tx.set(reportPrivateRef, {
            id: reportId,
            exactLocation,
            reporterEmail: userEmail,
            reporterName: userName,
            ownerStatus: 'submitted',
            activityLog: [
                {
                    action: 'created',
                    performedBy: userId,
                    performedAt: now,
                    details: 'Report submitted',
                },
            ],
        });
        // report_ops/{reportId}: initial document for admin operations
        const reportOpsRef = db.collection('report_ops').doc(reportId);
        tx.set(reportOpsRef, {
            id: reportId,
            municipalityCode: sanitizedData.municipalityCode,
            version: 1,
        });
    });
    // 8. Increment rate limit counter
    await (0, security_1.incrementRateLimit)(userId);
    return { reportId };
});
