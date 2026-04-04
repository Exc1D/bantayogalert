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
exports.getContacts = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const claims_1 = require("../auth/claims");
exports.getContacts = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const { municipalityCode, includeInactive = false } = data;
    const claims = context.auth.token;
    const db = admin.firestore();
    let query = db.collection('contacts');
    // Municipal scope enforcement
    if (!(0, claims_1.isSuperadmin)(claims)) {
        // Municipal admin can only see their own municipality's contacts
        const adminMunicipality = claims.municipalityCode;
        if (!adminMunicipality) {
            throw new functions.https.HttpsError('permission-denied', 'Municipality scope required');
        }
        query = query.where('municipalityCode', '==', adminMunicipality);
    }
    else if (municipalityCode) {
        // Superadmin can optionally filter by municipality
        query = query.where('municipalityCode', '==', municipalityCode);
    }
    // Filter inactive contacts unless explicitly requested
    if (!includeInactive) {
        query = query.where('isActive', '==', true);
    }
    query = query.orderBy('name', 'asc');
    const snapshot = await query.get();
    const contacts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    return { contacts };
});
