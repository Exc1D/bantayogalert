"use strict";
/**
 * Auth validation middleware for Cloud Functions.
 *
 * Validates that callers have appropriate role and municipality scope
 * before processing write operations.
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
exports.validateSuperadmin = validateSuperadmin;
exports.validateMunicipalAdmin = validateMunicipalAdmin;
exports.validateAuthenticated = validateAuthenticated;
exports.validateWriteScope = validateWriteScope;
exports.validateRole = validateRole;
const functions = __importStar(require("firebase-functions"));
const claims_1 = require("../auth/claims");
/**
 * Validate that the caller is a superadmin.
 * Throws permission-denied if not.
 *
 * @param context - The CallableContext from the Cloud Function
 */
function validateSuperadmin(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    if (!(0, claims_1.isSuperadmin)(context.auth.token)) {
        throw new functions.https.HttpsError('permission-denied', 'Superadmin access required');
    }
}
/**
 * Validate that the caller is a municipal admin for the specified municipality
 * OR a superadmin.
 * Throws permission-denied if not.
 *
 * @param context - The CallableContext from the Cloud Function
 * @param municipalityCode - The municipality code to validate against
 */
function validateMunicipalAdmin(context, municipalityCode) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const isAdmin = (0, claims_1.isSuperadmin)(context.auth.token) ||
        (0, claims_1.isMunicipalAdmin)(context.auth.token, municipalityCode);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required for this municipality');
    }
}
/**
 * Validate that the caller is authenticated.
 * Throws unauthenticated if not.
 *
 * @param context - The CallableContext from the Cloud Function
 */
function validateAuthenticated(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
}
/**
 * Validate write scope for a document creation/update.
 *
 * Superadmin can write to any municipality.
 * Municipal admin can only write to their own municipality.
 * Citizens can only write to their own documents (handled by reporterId check).
 *
 * @param context - The CallableContext from the Cloud Function
 * @param dataMunicipalityCode - Municipality code from the data being written
 * @param resourceMunicipalityCode - Municipality code of the existing resource (null for creates)
 */
function validateWriteScope(context, dataMunicipalityCode, resourceMunicipalityCode) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const claims = context.auth.token;
    // Superadmin can write anywhere
    if ((0, claims_1.isSuperadmin)(claims)) {
        return;
    }
    // For new documents (creates), the dataMunicipalityCode must match caller's scope
    if (resourceMunicipalityCode === null) {
        // Create operation
        if (dataMunicipalityCode === null) {
            // No municipality scope required for this document type
            return;
        }
        // Municipal admin can only create in their municipality
        if (!(0, claims_1.isMunicipalAdmin)(claims, dataMunicipalityCode)) {
            throw new functions.https.HttpsError('permission-denied', 'Cannot create document in this municipality');
        }
        return;
    }
    // Update operation - resource already has a municipality
    // Caller must be admin of that municipality
    if (!(0, claims_1.isMunicipalAdmin)(claims, resourceMunicipalityCode)) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required for this municipality');
    }
}
/**
 * Validate that the caller has the expected role.
 *
 * @param context - The CallableContext from the Cloud Function
 * @param requiredRole - The role required for this operation
 */
function validateRole(context, requiredRole) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    if (context.auth.token.role !== requiredRole) {
        throw new functions.https.HttpsError('permission-denied', `Required role: ${requiredRole}`);
    }
}
