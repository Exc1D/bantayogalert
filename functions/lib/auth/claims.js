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
exports.setCustomClaims = setCustomClaims;
exports.verifyCustomClaims = verifyCustomClaims;
exports.isSuperadmin = isSuperadmin;
exports.isMunicipalAdmin = isMunicipalAdmin;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
/**
 * UserRole values for Cloud Functions (Node runtime, cannot import from src/types)
 */
const UserRole = {
    Citizen: 'citizen',
    MunicipalAdmin: 'municipal_admin',
    ProvincialSuperadmin: 'provincial_superadmin',
};
/**
 * Set custom claims on both Firestore user document AND ID token.
 * Both must succeed for the operation to be considered complete.
 *
 * @param uid - Firebase Auth user UID
 * @param claims - Custom claims to set
 */
async function setCustomClaims(uid, claims) {
    const db = admin.firestore();
    // Update Firestore user document
    await db.doc(`users/${uid}`).set({
        role: claims.role,
        municipalityCode: claims.municipalityCode,
        provinceCode: claims.provinceCode,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    // Set custom claims on ID token
    await admin.auth().setCustomUserClaims(uid, claims);
    return { success: true };
}
/**
 * Verify custom claims structure and optionally check required role.
 */
function verifyCustomClaims(claims, requiredRole) {
    if (!claims || typeof claims.role !== 'string') {
        return { valid: false, reason: 'Missing or invalid role' };
    }
    if (typeof claims.provinceCode !== 'string') {
        return { valid: false, reason: 'Missing or invalid provinceCode' };
    }
    if (claims.municipalityCode !== null && typeof claims.municipalityCode !== 'string') {
        return { valid: false, reason: 'municipalityCode must be string or null' };
    }
    if (requiredRole && claims.role !== requiredRole) {
        return { valid: false, reason: `Role must be ${requiredRole}` };
    }
    return { valid: true };
}
/**
 * Check if claims indicate a provincial superadmin.
 */
function isSuperadmin(claims) {
    if (!claims || typeof claims !== 'object') {
        return false;
    }
    return (claims.role === UserRole.ProvincialSuperadmin);
}
/**
 * Check if claims indicate a municipal admin for a specific municipality.
 */
function isMunicipalAdmin(claims, municipalityCode) {
    if (!claims || typeof claims !== 'object') {
        return false;
    }
    const typedClaims = claims;
    return (typedClaims.role === UserRole.MunicipalAdmin &&
        (typedClaims.municipalityCode ?? null) === municipalityCode);
}
