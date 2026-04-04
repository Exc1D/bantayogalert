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
exports.createAnnouncement = void 0;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const claims_1 = require("../auth/claims");
const sanitize_1 = require("../security/sanitize");
const validateAuth_1 = require("../security/validateAuth");
const announcement_1 = require("../types/announcement");
const shared_1 = require("../audit/shared");
exports.createAnnouncement = functions.https.onCall(async (data, context) => {
    (0, validateAuth_1.validateAuthenticated)(context);
    const parsed = announcement_1.AnnouncementSchema.safeParse(data);
    if (!parsed.success) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid announcement data', { errors: parsed.error.issues });
    }
    const announcementData = parsed.data;
    const claims = context.auth.token;
    if (announcementData.targetScope.type === 'province' ||
        announcementData.targetScope.type === 'multi_municipality') {
        if (!(0, claims_1.isSuperadmin)(claims)) {
            throw new functions.https.HttpsError('permission-denied', 'Only provincial superadmins can target province-wide or multiple municipalities');
        }
    }
    else {
        (0, validateAuth_1.validateMunicipalAdmin)(context, announcementData.targetScope.municipalityCodes[0]);
    }
    const sanitized = (0, sanitize_1.sanitizeAnnouncementInput)(announcementData);
    const db = (0, firestore_1.getFirestore)();
    const announcementRef = db.collection('announcements').doc();
    const now = new Date().toISOString();
    await announcementRef.set({
        id: announcementRef.id,
        ...sanitized,
        status: announcement_1.AnnouncementStatus.Draft,
        createdBy: context.auth.uid,
        createdAt: now,
        updatedAt: now,
    });
    await (0, shared_1.appendAuditEntry)(null, db, {
        entityType: 'announcement',
        entityId: announcementRef.id,
        action: 'announcement_create',
        actorUid: context.auth.uid,
        actorRole: claims.role ?? 'citizen',
        municipalityCode: announcementData.targetScope.type === 'province'
            ? null
            : announcementData.targetScope.municipalityCodes[0] ?? null,
        provinceCode: 'CMN',
        createdAt: now,
        details: {
            status: announcement_1.AnnouncementStatus.Draft,
            targetScopeType: announcementData.targetScope.type,
            municipalityCodes: 'municipalityCodes' in announcementData.targetScope
                ? announcementData.targetScope.municipalityCodes
                : [],
        },
    });
    return {
        success: true,
        id: announcementRef.id,
    };
});
