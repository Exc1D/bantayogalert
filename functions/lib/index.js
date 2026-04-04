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
exports.stub = exports.setSurgeModeCF = exports.submitReport = exports.onUserCreated = exports.setUserRole = exports.validateRole = exports.validateWriteScope = exports.validateAuthenticated = exports.validateMunicipalAdmin = exports.validateSuperadmin = exports.disableSurgeModeForMunicipality = exports.enableSurgeModeForMunicipality = exports.isSurgeModeActive = exports.setSurgeMode = exports.incrementRateLimit = exports.checkRateLimit = exports.sanitizeAnnouncementInput = exports.sanitizeContactInput = exports.sanitizeReportInput = exports.sanitizeUserInput = exports.sanitizeObject = exports.sanitizeText = void 0;
const functions = __importStar(require("firebase-functions"));
const https_1 = require("firebase-functions/v2/https");
const setUserRole_1 = require("./auth/setUserRole");
Object.defineProperty(exports, "setUserRole", { enumerable: true, get: function () { return setUserRole_1.setUserRole; } });
const onUserCreated_1 = require("./auth/onUserCreated");
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return onUserCreated_1.onUserCreated; } });
const submitReport_1 = require("./reports/submitReport");
Object.defineProperty(exports, "submitReport", { enumerable: true, get: function () { return submitReport_1.submitReport; } });
// Security utilities
var security_1 = require("./security");
Object.defineProperty(exports, "sanitizeText", { enumerable: true, get: function () { return security_1.sanitizeText; } });
Object.defineProperty(exports, "sanitizeObject", { enumerable: true, get: function () { return security_1.sanitizeObject; } });
Object.defineProperty(exports, "sanitizeUserInput", { enumerable: true, get: function () { return security_1.sanitizeUserInput; } });
Object.defineProperty(exports, "sanitizeReportInput", { enumerable: true, get: function () { return security_1.sanitizeReportInput; } });
Object.defineProperty(exports, "sanitizeContactInput", { enumerable: true, get: function () { return security_1.sanitizeContactInput; } });
Object.defineProperty(exports, "sanitizeAnnouncementInput", { enumerable: true, get: function () { return security_1.sanitizeAnnouncementInput; } });
Object.defineProperty(exports, "checkRateLimit", { enumerable: true, get: function () { return security_1.checkRateLimit; } });
Object.defineProperty(exports, "incrementRateLimit", { enumerable: true, get: function () { return security_1.incrementRateLimit; } });
Object.defineProperty(exports, "setSurgeMode", { enumerable: true, get: function () { return security_1.setSurgeMode; } });
Object.defineProperty(exports, "isSurgeModeActive", { enumerable: true, get: function () { return security_1.isSurgeModeActive; } });
Object.defineProperty(exports, "enableSurgeModeForMunicipality", { enumerable: true, get: function () { return security_1.enableSurgeModeForMunicipality; } });
Object.defineProperty(exports, "disableSurgeModeForMunicipality", { enumerable: true, get: function () { return security_1.disableSurgeModeForMunicipality; } });
Object.defineProperty(exports, "validateSuperadmin", { enumerable: true, get: function () { return security_1.validateSuperadmin; } });
Object.defineProperty(exports, "validateMunicipalAdmin", { enumerable: true, get: function () { return security_1.validateMunicipalAdmin; } });
Object.defineProperty(exports, "validateAuthenticated", { enumerable: true, get: function () { return security_1.validateAuthenticated; } });
Object.defineProperty(exports, "validateWriteScope", { enumerable: true, get: function () { return security_1.validateWriteScope; } });
Object.defineProperty(exports, "validateRole", { enumerable: true, get: function () { return security_1.validateRole; } });
/**
 * Set surge mode for a municipality.
 * Enables 20 reports/hour instead of 5 for the specified municipality.
 *
 * Callable by superadmin (any municipality) or municipal_admin (own municipality).
 */
exports.setSurgeModeCF = (0, https_1.onCall)(async (request) => {
    const { auth } = request;
    if (!auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const { municipalityCode, enabled, durationMs } = request.data;
    if (!municipalityCode || typeof municipalityCode !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'municipalityCode required');
    }
    // Validate caller has permission
    const { isSuperadmin, isMunicipalAdmin } = await Promise.resolve().then(() => __importStar(require('./auth/claims')));
    const claims = auth.token;
    const isAdmin = isSuperadmin(claims) || isMunicipalAdmin(claims, municipalityCode);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required for this municipality');
    }
    // Apply surge mode
    const duration = typeof durationMs === 'number' ? durationMs : 24 * 60 * 60 * 1000;
    if (enabled) {
        const { enableSurgeModeForMunicipality } = await Promise.resolve().then(() => __importStar(require('./security/rateLimit')));
        await enableSurgeModeForMunicipality(municipalityCode, auth.uid, duration);
    }
    else {
        const { disableSurgeModeForMunicipality } = await Promise.resolve().then(() => __importStar(require('./security/rateLimit')));
        await disableSurgeModeForMunicipality(municipalityCode);
    }
    return {
        success: true,
        municipalityCode,
        enabled: Boolean(enabled),
    };
});
// Keep stub until more functions are added
exports.stub = functions.https.onRequest((req, res) => {
    res.status(200).json({ status: 'ok' });
});
