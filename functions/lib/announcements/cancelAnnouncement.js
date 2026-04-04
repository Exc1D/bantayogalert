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
exports.cancelAnnouncement = void 0;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const zod_1 = require("zod");
const claims_1 = require("../auth/claims");
const validateAuth_1 = require("../security/validateAuth");
const announcement_1 = require("../types/announcement");
const CancelAnnouncementSchema = zod_1.z.object({
    announcementId: zod_1.z.string().min(1),
});
exports.cancelAnnouncement = functions.https.onCall(async (data, context) => {
    (0, validateAuth_1.validateAuthenticated)(context);
    const parsed = CancelAnnouncementSchema.safeParse(data);
    if (!parsed.success) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid cancel request', { errors: parsed.error.issues });
    }
    const { announcementId } = parsed.data;
    const db = (0, firestore_1.getFirestore)();
    const announcementRef = db.collection('announcements').doc(announcementId);
    const snapshot = await announcementRef.get();
    if (!snapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'Announcement not found');
    }
    const announcement = snapshot.data();
    if (announcement.status === announcement_1.AnnouncementStatus.Cancelled) {
        throw new functions.https.HttpsError('failed-precondition', 'Announcement is already cancelled');
    }
    if (announcement.targetScope.type === 'province') {
        if (!(0, claims_1.isSuperadmin)(context.auth.token)) {
            throw new functions.https.HttpsError('permission-denied', 'Only provincial superadmins can cancel province-wide announcements');
        }
    }
    else if (announcement.targetScope.type === 'multi_municipality') {
        if (!(0, claims_1.isSuperadmin)(context.auth.token)) {
            throw new functions.https.HttpsError('permission-denied', 'Only provincial superadmins can cancel multi-municipality announcements');
        }
    }
    else {
        (0, validateAuth_1.validateMunicipalAdmin)(context, announcement.targetScope.municipalityCodes[0]);
    }
    const now = new Date().toISOString();
    await announcementRef.update({
        status: announcement_1.AnnouncementStatus.Cancelled,
        cancelledAt: now,
        updatedAt: now,
    });
    return {
        success: true,
        announcementId,
    };
});
