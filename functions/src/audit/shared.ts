import { randomUUID } from 'crypto'
import type { AuditAction, AuditActorRole, AuditEntityType, AuditEntry } from '../types/audit'

interface BuildAuditEntryPayload {
  entityType: AuditEntityType
  entityId: string
  action: AuditAction
  actorUid: string
  actorRole: AuditActorRole
  municipalityCode?: string | null
  provinceCode?: string
  createdAt?: string
  details?: Record<string, unknown>
}

export function buildAuditEntry(payload: BuildAuditEntryPayload): AuditEntry {
  const createdAt = payload.createdAt ?? new Date().toISOString()

  return {
    id: randomUUID(),
    entityType: payload.entityType,
    entityId: payload.entityId,
    action: payload.action,
    actorUid: payload.actorUid,
    actorRole: payload.actorRole,
    municipalityCode: payload.municipalityCode ?? null,
    provinceCode: payload.provinceCode ?? 'CMN',
    createdAt,
    details: payload.details ?? {},
  }
}

export async function appendAuditEntry(
  tx: FirebaseFirestore.Transaction | null,
  db: FirebaseFirestore.Firestore,
  payload: BuildAuditEntryPayload
) {
  const entry = buildAuditEntry(payload)
  const auditRef = db.collection('audit').doc(entry.id)

  if (tx) {
    tx.set(db.collection('audit').doc(entry.id), entry)
    return entry
  }

  await auditRef.set(entry)
  return entry
}
