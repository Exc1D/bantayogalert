"use strict";
/**
 * Per-user rate limiting for Cloud Functions.
 *
 * Default: 5 reports per hour per user
 * Surge mode: 20 reports per hour per user (admin-enabled per municipality)
 *
 * Uses Firestore documents for distributed rate limit state.
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
exports.checkRateLimit = checkRateLimit;
exports.incrementRateLimit = incrementRateLimit;
exports.isSurgeModeActive = isSurgeModeActive;
exports.setSurgeMode = setSurgeMode;
exports.enableSurgeModeForMunicipality = enableSurgeModeForMunicipality;
exports.disableSurgeModeForMunicipality = disableSurgeModeForMunicipality;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
// Rate limit configuration
const DEFAULT_RATE_LIMIT = {
    maxReports: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
};
const SURGE_RATE_LIMIT = {
    maxReports: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
};
// Surge mode defaults
const DEFAULT_SURGE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
/**
 * Check if a user is within their rate limit for report creation.
 *
 * @param userId - The Firebase Auth UID of the user
 * @param _isAdminRequest - Whether this is an admin-privileged request (future use)
 * @returns Promise with rate limit result
 */
async function checkRateLimit(userId, _isAdminRequest = false) {
    const rateLimitDoc = db.doc(`rate_limits/${userId}`);
    const doc = await rateLimitDoc.get();
    const now = firestore_1.Timestamp.now();
    const windowMs = DEFAULT_RATE_LIMIT.windowMs;
    // Determine effective limit (check for surge mode)
    let effectiveLimit = DEFAULT_RATE_LIMIT.maxReports;
    if (doc.exists) {
        const data = doc.data();
        // Check if user's personal surge mode is active
        if (data.surgeMode && data.surgeModeExpires) {
            if (data.surgeModeExpires.toMillis() > now.toMillis()) {
                effectiveLimit = SURGE_RATE_LIMIT.maxReports;
            }
        }
        // Check window expiration
        const windowStart = data.windowStart;
        if (windowStart) {
            const windowEnd = windowStart.toMillis() + windowMs;
            if (now.toMillis() >= windowEnd) {
                // Window expired - reset
                return {
                    allowed: true,
                    remaining: effectiveLimit - 1,
                    resetAt: new Date(now.toMillis() + windowMs),
                };
            }
            // Within window - check count
            if (data.count >= effectiveLimit) {
                return {
                    allowed: false,
                    remaining: 0,
                    resetAt: new Date(windowStart.toMillis() + windowMs),
                };
            }
            return {
                allowed: true,
                remaining: effectiveLimit - data.count - 1,
                resetAt: new Date(windowStart.toMillis() + windowMs),
            };
        }
    }
    // No record exists - allow
    return {
        allowed: true,
        remaining: effectiveLimit - 1,
        resetAt: new Date(now.toMillis() + windowMs),
    };
}
/**
 * Atomically increment the rate limit counter for a user.
 * Uses Firestore transaction to prevent race conditions.
 *
 * @param userId - The Firebase Auth UID of the user
 */
async function incrementRateLimit(userId) {
    const rateLimitDoc = db.doc(`rate_limits/${userId}`);
    const now = firestore_1.Timestamp.now();
    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(rateLimitDoc);
        if (!doc.exists) {
            // Create new rate limit record
            transaction.set(rateLimitDoc, {
                count: 1,
                windowStart: now,
                surgeMode: false,
                surgeModeExpires: null,
            });
            return;
        }
        const data = doc.data();
        const windowMs = DEFAULT_RATE_LIMIT.windowMs;
        // Check if window expired
        if (data.windowStart) {
            const windowEnd = data.windowStart.toMillis() + windowMs;
            if (now.toMillis() >= windowEnd) {
                // Reset window
                transaction.update(rateLimitDoc, {
                    count: 1,
                    windowStart: now,
                });
                return;
            }
        }
        // Increment existing counter
        transaction.update(rateLimitDoc, {
            count: firestore_1.FieldValue.increment(1),
        });
    });
}
/**
 * Check if surge mode is active for a municipality.
 *
 * @param municipalityCode - The municipality code
 * @returns Promise with true if surge mode is active
 */
async function isSurgeModeActive(municipalityCode) {
    const surgeDoc = db.doc(`rate_limits/surge/${municipalityCode}`);
    const doc = await surgeDoc.get();
    if (!doc.exists) {
        return false;
    }
    const data = doc.data();
    const now = firestore_1.Timestamp.now();
    return data.enabled && data.expiresAt.toMillis() > now.toMillis();
}
/**
 * Set surge mode for a municipality.
 * Only callable by municipal_admin or superadmin.
 *
 * @param municipalityCode - The municipality code
 * @param enabled - Whether to enable or disable surge mode
 * @param durationMs - Duration in milliseconds (default 24 hours)
 */
async function setSurgeMode(municipalityCode, enabled, durationMs = DEFAULT_SURGE_DURATION_MS) {
    const surgeDoc = db.doc(`rate_limits/surge/${municipalityCode}`);
    const now = firestore_1.Timestamp.now();
    if (enabled) {
        const expiresAt = firestore_1.Timestamp.fromMillis(now.toMillis() + durationMs);
        await surgeDoc.set({
            enabled: true,
            expiresAt,
            enabledBy: 'system', // Will be overridden by caller UID
        });
    }
    else {
        await surgeDoc.set({
            enabled: false,
            expiresAt: null,
        });
    }
}
/**
 * Enable surge mode for a municipality for a specific admin.
 *
 * @param municipalityCode - The municipality code
 * @param enabledBy - The admin UID who enabled surge mode
 * @param durationMs - Duration in milliseconds
 */
async function enableSurgeModeForMunicipality(municipalityCode, enabledBy, durationMs = DEFAULT_SURGE_DURATION_MS) {
    const surgeDoc = db.doc(`rate_limits/surge/${municipalityCode}`);
    const now = firestore_1.Timestamp.now();
    const expiresAt = firestore_1.Timestamp.fromMillis(now.toMillis() + durationMs);
    await surgeDoc.set({
        enabled: true,
        expiresAt,
        enabledBy,
    });
}
/**
 * Disable surge mode for a municipality.
 *
 * @param municipalityCode - The municipality code
 */
async function disableSurgeModeForMunicipality(municipalityCode) {
    const surgeDoc = db.doc(`rate_limits/surge/${municipalityCode}`);
    await surgeDoc.set({
        enabled: false,
        expiresAt: null,
    });
}
