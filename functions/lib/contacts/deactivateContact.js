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
exports.deactivateContact = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const validateAuth_1 = require("../security/validateAuth");
exports.deactivateContact = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const { id, deactivate } = data;
    if (!id) {
        throw new functions.https.HttpsError('invalid-argument', 'Contact ID is required');
    }
    if (typeof deactivate !== 'boolean') {
        throw new functions.https.HttpsError('invalid-argument', 'deactivate must be a boolean');
    }
    const db = admin.firestore();
    const contactRef = db.collection('contacts').doc(id);
    const contactDoc = await contactRef.get();
    if (!contactDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Contact not found');
    }
    const contactData = contactDoc.data();
    (0, validateAuth_1.validateMunicipalAdmin)(context, contactData.municipalityCode);
    await contactRef.update({
        isActive: !deactivate, // if deactivate=true, set isActive=false; if deactivate=false, reactivate
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    return { success: true, isActive: !deactivate };
});
