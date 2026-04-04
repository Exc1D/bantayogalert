# 11-03 Summary: Global Audit Stream and Mutation Wiring

## Completed: 2026-04-04

## Changes Made

### Audit helper
- Added [functions/src/audit/shared.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/audit/shared.ts) with `buildAuditEntry` and `appendAuditEntry`

### Report and triage audit writes
- Added audit writes to [functions/src/reports/submitReport.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/reports/submitReport.ts)
- Added audit writes to all relevant triage mutations in [functions/src/triage/triageVerify.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/triage/triageVerify.ts), [functions/src/triage/triageReject.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/triage/triageReject.ts), [functions/src/triage/triageDispatch.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/triage/triageDispatch.ts), [functions/src/triage/triageAcknowledge.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/triage/triageAcknowledge.ts), [functions/src/triage/triageInProgress.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/triage/triageInProgress.ts), [functions/src/triage/triageResolve.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/triage/triageResolve.ts), [functions/src/triage/triageReroute.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/triage/triageReroute.ts), [functions/src/triage/triageUpdatePriority.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/triage/triageUpdatePriority.ts), and [functions/src/triage/triageUpdateNotes.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/triage/triageUpdateNotes.ts)

### Contacts, announcements, and role admin audit writes
- Added audit writes to [functions/src/contacts/createContact.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/contacts/createContact.ts), [functions/src/contacts/updateContact.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/contacts/updateContact.ts), and [functions/src/contacts/deactivateContact.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/contacts/deactivateContact.ts)
- Added audit writes to [functions/src/announcements/createAnnouncement.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/announcements/createAnnouncement.ts), [functions/src/announcements/publishAnnouncement.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/announcements/publishAnnouncement.ts), and [functions/src/announcements/cancelAnnouncement.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/announcements/cancelAnnouncement.ts)
- Added role-change audit writes to [functions/src/auth/setUserRole.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/auth/setUserRole.ts)

## Verification
- Sensitive write paths now emit immutable entries into the global `audit` collection
- Audit entries include actor, entity, action, municipality scope, and structured details
- The audit viewer now has usable source data across reports, contacts, announcements, and role changes
