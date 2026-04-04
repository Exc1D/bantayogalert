"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateContactSchema = exports.CreateContactSchema = exports.ContactType = void 0;
/**
 * Cloud Functions contact types (Node runtime, cannot import from src/types)
 */
const zod_1 = require("zod");
exports.ContactType = {
    Police: 'police',
    Fire: 'fire',
    Medical: 'medical',
    Rescue: 'rescue',
    Barangay: 'barangay',
    Municipal: 'municipal',
    Provincial: 'provincial',
    NGO: 'ngo',
    Other: 'other',
};
exports.CreateContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    agency: zod_1.z.string().min(1).max(200),
    type: zod_1.z.nativeEnum(exports.ContactType),
    phones: zod_1.z.array(zod_1.z.string().regex(/^\+?[\d\s-]{7,20}$/)).min(1).max(5),
    email: zod_1.z.string().email().optional(),
    capabilities: zod_1.z.array(zod_1.z.string()).min(1).max(20),
    municipalityCode: zod_1.z.string().min(3).max(4),
    barangayCode: zod_1.z.string().min(6).max(7).optional(),
});
exports.UpdateContactSchema = exports.CreateContactSchema.partial();
