"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAuditEntry = buildAuditEntry;
exports.appendAuditEntry = appendAuditEntry;
const crypto_1 = require("crypto");
function buildAuditEntry(payload) {
    const createdAt = payload.createdAt ?? new Date().toISOString();
    return {
        id: (0, crypto_1.randomUUID)(),
        entityType: payload.entityType,
        entityId: payload.entityId,
        action: payload.action,
        actorUid: payload.actorUid,
        actorRole: payload.actorRole,
        municipalityCode: payload.municipalityCode ?? null,
        provinceCode: payload.provinceCode ?? 'CMN',
        createdAt,
        details: payload.details ?? {},
    };
}
async function appendAuditEntry(tx, db, payload) {
    const entry = buildAuditEntry(payload);
    const auditRef = db.collection('audit').doc(entry.id);
    if (tx) {
        tx.set(db.collection('audit').doc(entry.id), entry);
        return entry;
    }
    await auditRef.set(entry);
    return entry;
}
