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
exports.updateContact = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const contact_1 = require("../types/contact");
const sanitize_1 = require("../security/sanitize");
const validateAuth_1 = require("../security/validateAuth");
const shared_1 = require("../audit/shared");
exports.updateContact = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const { id, ...updates } = data;
    if (!id) {
        throw new functions.https.HttpsError('invalid-argument', 'Contact ID is required');
    }
    // Validate input
    const parseResult = contact_1.UpdateContactSchema.safeParse(updates);
    if (!parseResult.success) {
        throw new functions.https.HttpsError('invalid-argument', parseResult.error.message);
    }
    const db = admin.firestore();
    const contactRef = db.collection('contacts').doc(id);
    const contactDoc = await contactRef.get();
    if (!contactDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Contact not found');
    }
    const contactData = contactDoc.data();
    const municipalityCode = contactData.municipalityCode;
    // Municipal scope enforcement: caller must be admin of the contact's municipality
    (0, validateAuth_1.validateMunicipalAdmin)(context, municipalityCode);
    // Prevent changing municipalityCode (only superadmin should do this via delete+create)
    const sanitizedUpdates = (0, sanitize_1.sanitizeContactInput)(updates);
    delete sanitizedUpdates.municipalityCode;
    await contactRef.update({
        ...sanitizedUpdates,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    await (0, shared_1.appendAuditEntry)(null, db, {
        entityType: 'contact',
        entityId: id,
        action: 'contact_update',
        actorUid: context.auth.uid,
        actorRole: context.auth.token.role ?? 'citizen',
        municipalityCode,
        provinceCode: 'CMN',
        details: {
            updatedFields: Object.keys(sanitizedUpdates).sort(),
        },
    });
    return { success: true };
});
