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
exports.getAnnouncements = void 0;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const zod_1 = require("zod");
const announcement_1 = require("../types/announcement");
const validateAuth_1 = require("../security/validateAuth");
const GetAnnouncementsSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(announcement_1.AnnouncementType).optional(),
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.number().int().min(1).max(50).optional().default(20),
});
function sortAnnouncements(left, right) {
    const leftTime = left.publishedAt ?? left.createdAt;
    const rightTime = right.publishedAt ?? right.createdAt;
    if (leftTime === rightTime) {
        return right.id.localeCompare(left.id);
    }
    return rightTime.localeCompare(leftTime);
}
exports.getAnnouncements = functions.https.onCall(async (data, context) => {
    (0, validateAuth_1.validateAuthenticated)(context);
    const parsed = GetAnnouncementsSchema.safeParse(data);
    if (!parsed.success) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid announcement query', { errors: parsed.error.issues });
    }
    const { type, cursor, limit } = parsed.data;
    const claims = context.auth.token;
    const municipalityCode = claims.municipalityCode ?? null;
    const isProvincialSuperadmin = claims.role === 'provincial_superadmin';
    const db = (0, firestore_1.getFirestore)();
    let cursorSnapshot = null;
    if (cursor) {
        const cursorDoc = await db.collection('announcements').doc(cursor).get();
        cursorSnapshot = cursorDoc.exists ? cursorDoc : null;
    }
    const buildScopedQuery = (targetType, includeMunicipalityFilter = false) => {
        let queryRef = db
            .collection('announcements')
            .where('status', '==', announcement_1.AnnouncementStatus.Published)
            .where('targetScope.type', '==', targetType);
        if (type) {
            queryRef = queryRef.where('type', '==', type);
        }
        if (includeMunicipalityFilter && municipalityCode) {
            queryRef = queryRef.where('targetScope.municipalityCodes', 'array-contains', municipalityCode);
        }
        queryRef = queryRef.orderBy('publishedAt', 'desc').limit(limit);
        if (cursorSnapshot) {
            queryRef = queryRef.startAfter(cursorSnapshot);
        }
        return queryRef;
    };
    if (isProvincialSuperadmin) {
        let queryRef = db
            .collection('announcements')
            .where('status', '==', announcement_1.AnnouncementStatus.Published);
        if (type) {
            queryRef = queryRef.where('type', '==', type);
        }
        queryRef = queryRef.orderBy('publishedAt', 'desc').limit(limit);
        if (cursorSnapshot) {
            queryRef = queryRef.startAfter(cursorSnapshot);
        }
        const snapshot = await queryRef.get();
        const announcements = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return {
            success: true,
            announcements,
            cursor: snapshot.docs.at(-1)?.id ?? null,
        };
    }
    const [provinceSnapshot, municipalitySnapshot, multiMunicipalitySnapshot] = await Promise.all([
        buildScopedQuery('province').get(),
        municipalityCode
            ? buildScopedQuery('municipality', true).get()
            : Promise.resolve(null),
        municipalityCode
            ? buildScopedQuery('multi_municipality', true).get()
            : Promise.resolve(null),
    ]);
    const deduped = new Map();
    for (const snapshot of [
        provinceSnapshot,
        municipalitySnapshot,
        multiMunicipalitySnapshot,
    ]) {
        if (!snapshot)
            continue;
        for (const doc of snapshot.docs) {
            if (!deduped.has(doc.id)) {
                deduped.set(doc.id, {
                    id: doc.id,
                    ...doc.data(),
                });
            }
        }
    }
    const announcements = [...deduped.values()]
        .sort(sortAnnouncements)
        .slice(0, limit);
    return {
        success: true,
        announcements,
        cursor: announcements.at(-1)?.id ?? null,
    };
});
