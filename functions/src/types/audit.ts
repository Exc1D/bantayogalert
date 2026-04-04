export type AuditActorRole =
  | 'citizen'
  | 'municipal_admin'
  | 'provincial_superadmin'

export type AuditEntityType = 'report' | 'contact' | 'announcement' | 'user'

export type AuditAction =
  | 'report_submit'
  | 'triage_verify'
  | 'triage_reject'
  | 'triage_dispatch'
  | 'triage_acknowledge'
  | 'triage_in_progress'
  | 'triage_resolve'
  | 'triage_reroute'
  | 'triage_update_priority'
  | 'triage_update_notes'
  | 'contact_create'
  | 'contact_update'
  | 'contact_deactivate'
  | 'announcement_create'
  | 'announcement_publish'
  | 'announcement_cancel'
  | 'user_role_set'

export interface AuditEntry {
  id: string
  entityType: AuditEntityType
  entityId: string
  action: AuditAction
  actorUid: string
  actorRole: AuditActorRole
  municipalityCode: string | null
  provinceCode: string
  createdAt: string
  details: Record<string, unknown>
}

export interface AuditFilters {
  municipalityCode?: string | null
  entityType?: AuditEntityType | null
  action?: AuditAction | null
  actorUid?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  cursor?: string | null
}
