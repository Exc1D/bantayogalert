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
exports.onUserCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const claims_1 = require("./claims");
/**
 * Firebase Auth trigger that fires when a new user is created.
 * Sets default claims (citizen role, CMN province, null municipality)
 * and creates the Firestore user document.
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    const uid = user.uid;
    const email = user.email ?? '';
    // Default claims: citizen role, CMN province, no municipality
    const defaultClaims = {
        role: 'citizen',
        municipalityCode: null,
        provinceCode: 'CMN',
    };
    // Set claims atomically: Firestore doc + ID token
    await (0, claims_1.setCustomClaims)(uid, defaultClaims);
    // Also initialize the user document with default preferences
    // Note: setCustomClaims already sets role/municipalityCode/provinceCode via merge,
    // but we need to set notificationPreferences, email, displayName, and timestamps
    const db = admin.firestore();
    await db.doc(`users/${uid}`).set({
        email,
        displayName: '',
        notificationPreferences: {
            pushEnabled: false,
            emailEnabled: true,
            alertTypes: ['all'],
        },
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    functions.logger.info(`User created with default claims: ${uid}`);
});
