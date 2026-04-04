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
exports.stub = exports.setSurgeModeCF = exports.scheduledAggregation = exports.subscribeAnnouncementTopics = exports.getAnnouncements = exports.cancelAnnouncement = exports.publishAnnouncement = exports.createAnnouncement = exports.triageUpdateNotes = exports.triageUpdatePriority = exports.triageReroute = exports.triageResolve = exports.triageInProgress = exports.triageAcknowledge = exports.triageDispatch = exports.triageReject = exports.triageVerify = exports.getContacts = exports.deactivateContact = exports.updateContact = exports.createContact = exports.submitReport = exports.onUserCreated = exports.setUserRole = exports.validateRole = exports.validateWriteScope = exports.validateAuthenticated = exports.validateMunicipalAdmin = exports.validateSuperadmin = exports.disableSurgeModeForMunicipality = exports.enableSurgeModeForMunicipality = exports.isSurgeModeActive = exports.setSurgeMode = exports.incrementRateLimit = exports.checkRateLimit = exports.sanitizeAnnouncementInput = exports.sanitizeContactInput = exports.sanitizeReportInput = exports.sanitizeUserInput = exports.sanitizeObject = exports.sanitizeText = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const https_1 = require("firebase-functions/v2/https");
const setUserRole_1 = require("./auth/setUserRole");
Object.defineProperty(exports, "setUserRole", { enumerable: true, get: function () { return setUserRole_1.setUserRole; } });
const onUserCreated_1 = require("./auth/onUserCreated");
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return onUserCreated_1.onUserCreated; } });
const submitReport_1 = require("./reports/submitReport");
Object.defineProperty(exports, "submitReport", { enumerable: true, get: function () { return submitReport_1.submitReport; } });
const createContact_1 = require("./contacts/createContact");
Object.defineProperty(exports, "createContact", { enumerable: true, get: function () { return createContact_1.createContact; } });
const updateContact_1 = require("./contacts/updateContact");
Object.defineProperty(exports, "updateContact", { enumerable: true, get: function () { return updateContact_1.updateContact; } });
const deactivateContact_1 = require("./contacts/deactivateContact");
Object.defineProperty(exports, "deactivateContact", { enumerable: true, get: function () { return deactivateContact_1.deactivateContact; } });
const getContacts_1 = require("./contacts/getContacts");
Object.defineProperty(exports, "getContacts", { enumerable: true, get: function () { return getContacts_1.getContacts; } });
const triageVerify_1 = require("./triage/triageVerify");
Object.defineProperty(exports, "triageVerify", { enumerable: true, get: function () { return triageVerify_1.triageVerify; } });
const triageReject_1 = require("./triage/triageReject");
Object.defineProperty(exports, "triageReject", { enumerable: true, get: function () { return triageReject_1.triageReject; } });
const triageDispatch_1 = require("./triage/triageDispatch");
Object.defineProperty(exports, "triageDispatch", { enumerable: true, get: function () { return triageDispatch_1.triageDispatch; } });
const triageAcknowledge_1 = require("./triage/triageAcknowledge");
Object.defineProperty(exports, "triageAcknowledge", { enumerable: true, get: function () { return triageAcknowledge_1.triageAcknowledge; } });
const triageInProgress_1 = require("./triage/triageInProgress");
Object.defineProperty(exports, "triageInProgress", { enumerable: true, get: function () { return triageInProgress_1.triageInProgress; } });
const triageResolve_1 = require("./triage/triageResolve");
Object.defineProperty(exports, "triageResolve", { enumerable: true, get: function () { return triageResolve_1.triageResolve; } });
const triageReroute_1 = require("./triage/triageReroute");
Object.defineProperty(exports, "triageReroute", { enumerable: true, get: function () { return triageReroute_1.triageReroute; } });
const triageUpdatePriority_1 = require("./triage/triageUpdatePriority");
Object.defineProperty(exports, "triageUpdatePriority", { enumerable: true, get: function () { return triageUpdatePriority_1.triageUpdatePriority; } });
const triageUpdateNotes_1 = require("./triage/triageUpdateNotes");
Object.defineProperty(exports, "triageUpdateNotes", { enumerable: true, get: function () { return triageUpdateNotes_1.triageUpdateNotes; } });
const createAnnouncement_1 = require("./announcements/createAnnouncement");
Object.defineProperty(exports, "createAnnouncement", { enumerable: true, get: function () { return createAnnouncement_1.createAnnouncement; } });
const publishAnnouncement_1 = require("./announcements/publishAnnouncement");
Object.defineProperty(exports, "publishAnnouncement", { enumerable: true, get: function () { return publishAnnouncement_1.publishAnnouncement; } });
const cancelAnnouncement_1 = require("./announcements/cancelAnnouncement");
Object.defineProperty(exports, "cancelAnnouncement", { enumerable: true, get: function () { return cancelAnnouncement_1.cancelAnnouncement; } });
const getAnnouncements_1 = require("./announcements/getAnnouncements");
Object.defineProperty(exports, "getAnnouncements", { enumerable: true, get: function () { return getAnnouncements_1.getAnnouncements; } });
const subscribeAnnouncementTopics_1 = require("./announcements/subscribeAnnouncementTopics");
Object.defineProperty(exports, "subscribeAnnouncementTopics", { enumerable: true, get: function () { return subscribeAnnouncementTopics_1.subscribeAnnouncementTopics; } });
const scheduledAggregation_1 = require("./analytics/scheduledAggregation");
Object.defineProperty(exports, "scheduledAggregation", { enumerable: true, get: function () { return scheduledAggregation_1.scheduledAggregation; } });
if (admin.apps.length === 0) {
    admin.initializeApp();
}
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
