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
exports.setUserRole = void 0;
const functions = __importStar(require("firebase-functions"));
const claims_1 = require("./claims");
const VALID_ROLES = ['citizen', 'municipal_admin', 'provincial_superadmin'];
const MUNICIPALITY_CODE_REGEX = /^[A-Z]{3,4}$/;
exports.setUserRole = functions.https.onCall(async (data, context) => {
    // Validate caller authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Caller must be authenticated');
    }
    const callerClaims = context.auth.token;
    // Verify caller is superadmin
    if (!(0, claims_1.isSuperadmin)(callerClaims)) {
        throw new functions.https.HttpsError('permission-denied', 'Only superadmins can assign roles');
    }
    // Validate required fields
    if (!data.uid) {
        throw new functions.https.HttpsError('invalid-argument', 'uid is required');
    }
    if (!data.role) {
        throw new functions.https.HttpsError('invalid-argument', 'role is required');
    }
    // Validate role value
    if (!VALID_ROLES.includes(data.role)) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }
    // Role-specific municipalityCode validation
    if (data.role === 'municipal_admin') {
        if (!data.municipalityCode) {
            throw new functions.https.HttpsError('invalid-argument', 'municipalityCode required for municipal_admin role');
        }
        if (!MUNICIPALITY_CODE_REGEX.test(data.municipalityCode)) {
            throw new functions.https.HttpsError('invalid-argument', 'municipalityCode must be 3-4 uppercase letters');
        }
    }
    if ((data.role === 'citizen' || data.role === 'provincial_superadmin') &&
        data.municipalityCode !== null) {
        throw new functions.https.HttpsError('invalid-argument', 'municipalityCode must be null for citizen and superadmin roles');
    }
    // Build claims object
    const claims = {
        role: data.role,
        municipalityCode: data.municipalityCode,
        provinceCode: 'CMN',
    };
    // Set claims atomically on Firestore doc and ID token
    await (0, claims_1.setCustomClaims)(data.uid, claims);
    return {
        success: true,
        role: claims.role,
        municipalityCode: claims.municipalityCode,
        provinceCode: claims.provinceCode,
    };
});
