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
exports.subscribeAnnouncementTopics = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
const validateAuth_1 = require("../security/validateAuth");
const SubscribeAnnouncementTopicsSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    municipalityCode: zod_1.z.string().min(3).max(4).nullable().optional(),
});
exports.subscribeAnnouncementTopics = functions.https.onCall(async (data, context) => {
    (0, validateAuth_1.validateAuthenticated)(context);
    const parsed = SubscribeAnnouncementTopicsSchema.safeParse(data);
    if (!parsed.success) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid topic subscription payload', { errors: parsed.error.issues });
    }
    const { token } = parsed.data;
    const claims = context.auth.token;
    const municipalityCode = claims.municipalityCode ?? parsed.data.municipalityCode ?? null;
    const topics = ['province_CMN'];
    if (municipalityCode) {
        topics.push(`municipality_${municipalityCode}`);
    }
    await Promise.all(topics.map((topic) => admin.messaging().subscribeToTopic([token], topic)));
    return {
        success: true,
        topics,
    };
});
