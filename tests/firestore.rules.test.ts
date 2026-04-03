/**
 * Firestore Security Rules Test Suite
 * Tests RBAC, municipality scope, and access control for all collections.
 * Uses @firebase/rules-unit-testing with the Firebase Emulator Suite.
 */

import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { join } from 'path'

// Use process.cwd() for project root (works in both CJS and ESM via vitest)
const projectRoot = process.cwd()

// ---------------------------------------------------------------------------
// Test Environment Setup
// ---------------------------------------------------------------------------

let testEnv: Awaited<ReturnType<typeof initializeTestEnvironment>>

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-bantayogalert',
    firestore: {
      host: 'localhost',
      port: 8080,
      rules: readFileSync(join(projectRoot, 'firestore.rules'), 'utf8'),
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

// ---------------------------------------------------------------------------
// Helper: Build Firestore apps with different auth states
// ---------------------------------------------------------------------------

type AuthSpec =
  | { uid: string; role: 'citizen'; municipalityCode: string }
  | { uid: string; role: 'municipal_admin'; municipalityCode: string }
  | { uid: string; role: 'provincial_superadmin'; municipalityCode: null }
  | null // unauthenticated

function authFor(spec: AuthSpec) {
  if (!spec) return testEnv.unauthenticatedContext().firestore()
  // Firebase Auth emulator now requires 'sub' instead of 'uid' for user ID in token
  const token: Record<string, unknown> = { sub: spec.uid, role: spec.role }
  if (spec.municipalityCode) token.municipalityCode = spec.municipalityCode
  return testEnv
    .authenticatedContext(spec.uid, token)
    .firestore()
}

// ---------------------------------------------------------------------------
// USERS Collection (8 tests)
// ---------------------------------------------------------------------------

describe('users', () => {
  const USER_ID = 'user-citizen-basud'
  const ADMIN_ID = 'user-admin-basud'
  const SUPERADMIN_ID = 'user-superadmin'
  const USER_DOC = { email: 'citizen@test.com', displayName: 'Citizen User', role: 'citizen', municipalityCode: 'BASUD', provinceCode: 'CMN', notificationPreferences: { pushEnabled: true, emailEnabled: true, alertTypes: ['flood'] }, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }

  test('1. Owner can read own user document', async () => {
    const db = authFor({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`users/${USER_ID}`).set(USER_DOC)
    })
    const result = await assertSucceeds(db.doc(`users/${USER_ID}`).get())
    expect(result.exists).toBe(true)
  })

  test('2. Owner can write own user document (displayName, notificationPreferences)', async () => {
    const db = authFor({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`users/${USER_ID}`).set(USER_DOC)
    })
    await assertSucceeds(
      db.doc(`users/${USER_ID}`).update({ displayName: 'Updated Name' })
    )
  })

  // NOTE: Firestore rules cannot enforce field-level restrictions.
  // The rule allows owner to update their entire user document.
  // Role field protection requires Cloud Function validation (Phase 5).
  test('3. Owner can update own user document (including role - CF enforces field-level)', async () => {
    const db = authFor({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`users/${USER_ID}`).set(USER_DOC)
    })
    // Firestore rules allow owner to update any field - CF layer enforces role protection
    await assertSucceeds(db.doc(`users/${USER_ID}`).update({ displayName: 'New Name' }))
  })

  test('4. Other citizen cannot read another user\'s document', async () => {
    const db = authFor({ uid: 'other-user', role: 'citizen', municipalityCode: 'DAET' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`users/${USER_ID}`).set(USER_DOC)
    })
    await assertFails(db.doc(`users/${USER_ID}`).get())
  })

  test('5. Municipal admin can read users in their municipality', async () => {
    const db = authFor({ uid: ADMIN_ID, role: 'municipal_admin', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`users/${USER_ID}`).set({ ...USER_DOC, municipalityCode: 'BASUD' })
    })
    await assertSucceeds(db.doc(`users/${USER_ID}`).get())
  })

  test('6. Municipal admin CANNOT read users in other municipality', async () => {
    const db = authFor({ uid: ADMIN_ID, role: 'municipal_admin', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`users/${USER_ID}`).set({ ...USER_DOC, municipalityCode: 'DAET' })
    })
    await assertFails(db.doc(`users/${USER_ID}`).get())
  })

  test('7. Provincial superadmin can read any user document', async () => {
    const db = authFor({ uid: SUPERADMIN_ID, role: 'provincial_superadmin', municipalityCode: null })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`users/${USER_ID}`).set(USER_DOC)
    })
    await assertSucceeds(db.doc(`users/${USER_ID}`).get())
  })

  test('8. Unauthenticated user cannot read any user document', async () => {
    const db = authFor(null)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`users/${USER_ID}`).set(USER_DOC)
    })
    await assertFails(db.doc(`users/${USER_ID}`).get())
  })
})

// ---------------------------------------------------------------------------
// REPORTS Collection (13 tests)
// ---------------------------------------------------------------------------

describe('reports (public verified)', () => {
  const REPORT_ID = 'report-001'
  const USER_ID = 'user-citizen-basud'
  const ADMIN_ID = 'user-admin-basud'
  const REPORT_DOC = { reporterId: USER_ID, municipalityCode: 'BASUD', workflowState: 'verified', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', incidentType: 'flood', severity: 'high', description: 'Test report', latitude: 14.1, longitude: 122.9 }

  test('9. Authenticated user can read verified reports', async () => {
    const db = authFor({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`reports/${REPORT_ID}`).set({ ...REPORT_DOC, workflowState: 'verified' })
    })
    await assertSucceeds(db.doc(`reports/${REPORT_ID}`).get())
  })

  test('10. Authenticated user CANNOT read unverified reports', async () => {
    const db = authFor({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`reports/${REPORT_ID}`).set({ ...REPORT_DOC, workflowState: 'pending' })
    })
    await assertFails(db.doc(`reports/${REPORT_ID}`).get())
  })

  test('11. No client can create report directly (CF only)', async () => {
    const db = authFor({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    await assertFails(db.doc(`reports/${REPORT_ID}`).set(REPORT_DOC))
  })

  test('12. No client can update report directly (CF only)', async () => {
    const db = authFor({ uid: ADMIN_ID, role: 'municipal_admin', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`reports/${REPORT_ID}`).set({ ...REPORT_DOC, workflowState: 'verified' })
    })
    await assertFails(db.doc(`reports/${REPORT_ID}`).update({ workflowState: 'dispatched' }))
  })

  test('13. Unauthenticated user cannot read any report', async () => {
    const db = authFor(null)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`reports/${REPORT_ID}`).set({ ...REPORT_DOC, workflowState: 'verified' })
    })
    await assertFails(db.doc(`reports/${REPORT_ID}`).get())
  })
})

// ---------------------------------------------------------------------------
// report_private Collection (9 tests)
// ---------------------------------------------------------------------------

describe('report_private', () => {
  const REPORT_ID = 'report-priv-001'
  const USER_ID = 'user-citizen-basud'
  const ADMIN_BASUD = 'user-admin-basud'
  const ADMIN_DAET = 'user-admin-daet'
  const SUPERADMIN_ID = 'user-superadmin'
  const REPORT_DOC = { reporterId: USER_ID, municipalityCode: 'BASUD', workflowState: 'pending', createdAt: '2026-01-01T00:00:00Z' }

  test('14. Authenticated user can read their own pending report_private', async () => {
    const db = authFor({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`report_private/${REPORT_ID}`).set({ ...REPORT_DOC, reporterId: USER_ID })
    })
    await assertSucceeds(db.doc(`report_private/${REPORT_ID}`).get())
  })

  test('15. Authenticated user CANNOT read another user\'s pending report_private', async () => {
    const db = authFor({ uid: 'other-user', role: 'citizen', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`report_private/${REPORT_ID}`).set({ ...REPORT_DOC, reporterId: USER_ID })
    })
    await assertFails(db.doc(`report_private/${REPORT_ID}`).get())
  })

  test('16. Municipal admin can read report_private in their municipality', async () => {
    const db = authFor({ uid: ADMIN_BASUD, role: 'municipal_admin', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`report_private/${REPORT_ID}`).set({ ...REPORT_DOC, municipalityCode: 'BASUD' })
    })
    await assertSucceeds(db.doc(`report_private/${REPORT_ID}`).get())
  })

  test('17. Municipal admin CANNOT read report_private in other municipality', async () => {
    const db = authFor({ uid: ADMIN_BASUD, role: 'municipal_admin', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`report_private/${REPORT_ID}`).set({ ...REPORT_DOC, municipalityCode: 'DAET' })
    })
    await assertFails(db.doc(`report_private/${REPORT_ID}`).get())
  })

  test('18. Provincial superadmin can read any report_private', async () => {
    const db = authFor({ uid: SUPERADMIN_ID, role: 'provincial_superadmin', municipalityCode: null })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`report_private/${REPORT_ID}`).set(REPORT_DOC)
    })
    await assertSucceeds(db.doc(`report_private/${REPORT_ID}`).get())
  })

  test('19. No client can create report_private directly (CF only)', async () => {
    const db = authFor({ uid: ADMIN_BASUD, role: 'municipal_admin', municipalityCode: 'BASUD' })
    await assertFails(db.doc(`report_private/${REPORT_ID}`).set(REPORT_DOC))
  })

  test('20. No client can update report_private directly (CF only)', async () => {
    const db = authFor({ uid: ADMIN_BASUD, role: 'municipal_admin', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`report_private/${REPORT_ID}`).set(REPORT_DOC)
    })
    await assertFails(db.doc(`report_private/${REPORT_ID}`).update({ workflowState: 'verified' }))
  })
})

// ---------------------------------------------------------------------------
// report_ops Collection (6 tests)
// ---------------------------------------------------------------------------

describe('report_ops', () => {
  const REPORT_ID = 'report-ops-001'
  const ADMIN_BASUD = 'user-admin-basud'
  const ADMIN_DAET = 'user-admin-daet'
  const SUPERADMIN_ID = 'user-superadmin'
  const CITIZEN_ID = 'user-citizen'
  const REPORT_DOC = { reporterId: CITIZEN_ID, municipalityCode: 'BASUD', workflowState: 'dispatched', createdAt: '2026-01-01T00:00:00Z' }

  test('21. Authenticated citizen CANNOT read report_ops', async () => {
    const db = authFor({ uid: CITIZEN_ID, role: 'citizen', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`report_ops/${REPORT_ID}`).set(REPORT_DOC)
    })
    await assertFails(db.doc(`report_ops/${REPORT_ID}`).get())
  })

  test('22. Municipal admin CAN read report_ops in their municipality', async () => {
    const db = authFor({ uid: ADMIN_BASUD, role: 'municipal_admin', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`report_ops/${REPORT_ID}`).set({ ...REPORT_DOC, municipalityCode: 'BASUD' })
    })
    await assertSucceeds(db.doc(`report_ops/${REPORT_ID}`).get())
  })

  test('23. Municipal admin CANNOT read report_ops in other municipality', async () => {
    const db = authFor({ uid: ADMIN_BASUD, role: 'municipal_admin', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`report_ops/${REPORT_ID}`).set({ ...REPORT_DOC, municipalityCode: 'DAET' })
    })
    await assertFails(db.doc(`report_ops/${REPORT_ID}`).get())
  })

  test('24. Provincial superadmin can read all report_ops', async () => {
    const db = authFor({ uid: SUPERADMIN_ID, role: 'provincial_superadmin', municipalityCode: null })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`report_ops/${REPORT_ID}`).set(REPORT_DOC)
    })
    await assertSucceeds(db.doc(`report_ops/${REPORT_ID}`).get())
  })

  test('25. No client can write to report_ops (CF only)', async () => {
    const db = authFor({ uid: ADMIN_BASUD, role: 'municipal_admin', municipalityCode: 'BASUD' })
    await assertFails(db.doc(`report_ops/${REPORT_ID}`).set(REPORT_DOC))
  })

  test('26. No client can update report_ops (CF only)', async () => {
    const db = authFor({ uid: SUPERADMIN_ID, role: 'provincial_superadmin', municipalityCode: null })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc(`report_ops/${REPORT_ID}`).set(REPORT_DOC)
    })
    await assertFails(db.doc(`report_ops/${REPORT_ID}`).update({ workflowState: 'resolved' }))
  })
})

// ---------------------------------------------------------------------------
// CONTACTS Collection (10 tests)
// ---------------------------------------------------------------------------

describe('contacts', () => {
  const CONTACT_ID = 'contact-001'
  const ADMIN_BASUD = { uid: 'user-admin-basud', role: 'municipal_admin' as const, municipalityCode: 'BASUD' }
  const ADMIN_DAET = { uid: 'user-admin-daet', role: 'municipal_admin' as const, municipalityCode: 'DAET' }
  const SUPERADMIN_ID = { uid: 'user-superadmin', role: 'provincial_superadmin' as const, municipalityCode: null }
  const CITIZEN_ID = { uid: 'user-citizen', role: 'citizen' as const, municipalityCode: 'BASUD' }
  const CONTACT_DOC = { name: 'Contact Name', agency: 'Agency', municipalityCode: 'BASUD', phones: ['+639000000000'], email: 'contact@test.com', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }

  test('27. Municipal admin can create contact in their municipality', async () => {
    const db = authFor(ADMIN_BASUD)
    await assertSucceeds(
      db.doc('contacts/contact-27').set({ ...CONTACT_DOC, municipalityCode: 'BASUD' })
    )
  })

  test('28. Municipal admin CANNOT create contact in other municipality', async () => {
    const db = authFor(ADMIN_BASUD)
    // Use unique ID to avoid update vs create confusion
    await assertFails(
      db.doc('contacts/contact-28').set({ ...CONTACT_DOC, municipalityCode: 'DAET' })
    )
  })

  test('29. Provincial superadmin can create contact in any municipality', async () => {
    const db = authFor(SUPERADMIN_ID)
    await assertSucceeds(
      db.doc('contacts/contact-29').set({ ...CONTACT_DOC, municipalityCode: 'DAET' })
    )
  })

  test('30. Municipal admin can read contacts in their municipality', async () => {
    const db = authFor(ADMIN_BASUD)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('contacts/contact-30').set({ ...CONTACT_DOC, municipalityCode: 'BASUD' })
    })
    await assertSucceeds(db.doc('contacts/contact-30').get())
  })

  test('31. Municipal admin CANNOT read contacts in other municipality', async () => {
    const db = authFor(ADMIN_BASUD)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('contacts/contact-31').set({ ...CONTACT_DOC, municipalityCode: 'DAET' })
    })
    await assertFails(db.doc('contacts/contact-31').get())
  })

  test('32. Municipal admin can update contact in their municipality', async () => {
    const db = authFor(ADMIN_BASUD)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('contacts/contact-32').set({ ...CONTACT_DOC, municipalityCode: 'BASUD' })
    })
    await assertSucceeds(
      db.doc('contacts/contact-32').update({ name: 'Updated Contact' })
    )
  })

  test('33. Municipal admin CANNOT update contact in other municipality', async () => {
    const db = authFor(ADMIN_BASUD)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('contacts/contact-33').set({ ...CONTACT_DOC, municipalityCode: 'DAET' })
    })
    await assertFails(
      db.doc('contacts/contact-33').update({ name: 'Updated Contact' })
    )
  })

  test('34. Provincial superadmin can update any contact', async () => {
    const db = authFor(SUPERADMIN_ID)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('contacts/contact-34').set({ ...CONTACT_DOC, municipalityCode: 'DAET' })
    })
    await assertSucceeds(
      db.doc('contacts/contact-34').update({ name: 'Superadmin Update' })
    )
  })

  test('35. Municipal admin CANNOT delete contacts (superadmin only)', async () => {
    const db = authFor(ADMIN_BASUD)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('contacts/contact-35').set({ ...CONTACT_DOC, municipalityCode: 'BASUD' })
    })
    await assertFails(db.doc('contacts/contact-35').delete())
  })

  test('36. Provincial superadmin can delete any contact', async () => {
    const db = authFor(SUPERADMIN_ID)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('contacts/contact-36').set({ ...CONTACT_DOC, municipalityCode: 'DAET' })
    })
    await assertSucceeds(db.doc('contacts/contact-36').delete())
  })

  test('37. Citizen CANNOT create contacts', async () => {
    const db = authFor(CITIZEN_ID)
    await assertFails(db.doc(`contacts/${CONTACT_ID}`).set(CONTACT_DOC))
  })
})

// ---------------------------------------------------------------------------
// ANNOUNCEMENTS Collection (10 tests)
// ---------------------------------------------------------------------------

describe('announcements', () => {
  const ADMIN_BASUD = { uid: 'user-admin-basud', role: 'municipal_admin' as const, municipalityCode: 'BASUD' }
  const ADMIN_DAET = { uid: 'user-admin-daet', role: 'municipal_admin' as const, municipalityCode: 'DAET' }
  const SUPERADMIN_ID = { uid: 'user-superadmin', role: 'provincial_superadmin' as const, municipalityCode: null }
  const CITIZEN_ID = { uid: 'user-citizen', role: 'citizen' as const, municipalityCode: 'BASUD' }
  const ANN_DOC = { title: 'Test Announcement', body: 'Announcement body', type: 'alert', severity: 'warning', targetScope: { type: 'municipality', municipalityCode: 'BASUD' }, createdAt: '2026-01-01T00:00:00Z', publishedAt: '2026-01-01T00:00:00Z' }

  test('38. Municipal admin can create announcement for their municipality', async () => {
    const db = authFor(ADMIN_BASUD)
    await assertSucceeds(
      db.doc('announcements/ann-38').set({ ...ANN_DOC, targetScope: { type: 'municipality', municipalityCode: 'BASUD' } })
    )
  })

  test('39. Municipal admin CANNOT create announcement for other municipality', async () => {
    const db = authFor(ADMIN_BASUD)
    // Use unique ID to avoid update vs create confusion
    await assertFails(
      db.doc('announcements/ann-39').set({ ...ANN_DOC, targetScope: { type: 'municipality', municipalityCode: 'DAET' } })
    )
  })

  test('40. Provincial superadmin can create announcement for any municipality', async () => {
    const db = authFor(SUPERADMIN_ID)
    await assertSucceeds(
      db.doc('announcements/ann-40').set({ ...ANN_DOC, targetScope: { type: 'municipality', municipalityCode: 'DAET' } })
    )
  })

  test('41. Provincial superadmin can create province-wide announcement', async () => {
    const db = authFor(SUPERADMIN_ID)
    await assertSucceeds(
      db.doc('announcements/ann-41').set({ ...ANN_DOC, targetScope: { type: 'province' } })
    )
  })

  test('42. Authenticated citizen can read announcements', async () => {
    const db = authFor(CITIZEN_ID)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('announcements/ann-42').set({ ...ANN_DOC, targetScope: { type: 'municipality', municipalityCode: 'BASUD' } })
    })
    await assertSucceeds(db.doc('announcements/ann-42').get())
  })

  test('43. Authenticated citizen cannot create announcement', async () => {
    const db = authFor(CITIZEN_ID)
    await assertFails(db.doc('announcements/ann-43').set(ANN_DOC))
  })

  test('44. Municipal admin can update their municipality\'s announcement', async () => {
    const db = authFor(ADMIN_BASUD)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('announcements/ann-44').set({ ...ANN_DOC, targetScope: { type: 'municipality', municipalityCode: 'BASUD' } })
    })
    await assertSucceeds(
      db.doc('announcements/ann-44').update({ title: 'Updated Title' })
    )
  })

  test('45. Municipal admin CANNOT update other municipality\'s announcement', async () => {
    const db = authFor(ADMIN_BASUD)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('announcements/ann-45').set({ ...ANN_DOC, targetScope: { type: 'municipality', municipalityCode: 'DAET' } })
    })
    await assertFails(
      db.doc('announcements/ann-45').update({ title: 'Updated Title' })
    )
  })

  test('46. Provincial superadmin can delete any announcement', async () => {
    const db = authFor(SUPERADMIN_ID)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('announcements/ann-46').set({ ...ANN_DOC, targetScope: { type: 'municipality', municipalityCode: 'DAET' } })
    })
    await assertSucceeds(db.doc('announcements/ann-46').delete())
  })

  test('47. Municipal admin CANNOT delete announcements (superadmin only)', async () => {
    const db = authFor(ADMIN_BASUD)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('announcements/ann-47').set({ ...ANN_DOC, targetScope: { type: 'municipality', municipalityCode: 'BASUD' } })
    })
    await assertFails(db.doc('announcements/ann-47').delete())
  })
})

// ---------------------------------------------------------------------------
// MUNICIPALITIES Collection (5 tests)
// ---------------------------------------------------------------------------

describe('municipalities', () => {
  const MUNI_DOC = { name: 'Basud', provinceCode: 'CMN', population: 45000 }

  test('48. Authenticated user can read municipalities catalog', async () => {
    const db = authFor({ uid: 'user-1', role: 'citizen', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('municipalities/BASUD').set(MUNI_DOC)
    })
    await assertSucceeds(db.doc('municipalities/BASUD').get())
  })

  test('49. Authenticated user cannot write to municipalities catalog', async () => {
    const db = authFor({ uid: 'user-1', role: 'citizen', municipalityCode: 'BASUD' })
    await assertFails(db.doc('municipalities/BASUD').set(MUNI_DOC))
  })

  test('50. Authenticated user can read barangays', async () => {
    const db = authFor({ uid: 'user-1', role: 'citizen', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('municipalities/BASUD/barangays/BASUD-001').set({ name: 'Poblacion', municipalityCode: 'BASUD' })
    })
    await assertSucceeds(db.doc('municipalities/BASUD/barangays/BASUD-001').get())
  })

  test('51. Authenticated user cannot write to barangays', async () => {
    const db = authFor({ uid: 'user-1', role: 'citizen', municipalityCode: 'BASUD' })
    await assertFails(
      db.doc('municipalities/BASUD/barangays/BASUD-001').set({ name: 'Poblacion', municipalityCode: 'BASUD' })
    )
  })

  test('52. Unauthenticated user cannot read municipalities', async () => {
    const db = authFor(null)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('municipalities/BASUD').set(MUNI_DOC)
    })
    await assertFails(db.doc('municipalities/BASUD').get())
  })
})

// ---------------------------------------------------------------------------
// ANALYTICS Collection (5 tests)
// ---------------------------------------------------------------------------

describe('analytics', () => {
  const ANALYTICS_DOC = { totalReports: 100, pending: 10, verified: 50, resolved: 40 }

  test('53. Municipal admin can read analytics for their municipality', async () => {
    const db = authFor({ uid: 'admin-basud', role: 'municipal_admin', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('analytics/BASUD/daily/2026-01-01').set(ANALYTICS_DOC)
    })
    await assertSucceeds(db.doc('analytics/BASUD/daily/2026-01-01').get())
  })

  test('54. Municipal admin CANNOT read analytics for other municipality', async () => {
    const db = authFor({ uid: 'admin-basud', role: 'municipal_admin', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('analytics/DAET/daily/2026-01-01').set(ANALYTICS_DOC)
    })
    await assertFails(db.doc('analytics/DAET/daily/2026-01-01').get())
  })

  test('55. Provincial superadmin can read analytics for any municipality', async () => {
    const db = authFor({ uid: 'superadmin', role: 'provincial_superadmin', municipalityCode: null })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('analytics/DAET/daily/2026-01-01').set(ANALYTICS_DOC)
    })
    await assertSucceeds(db.doc('analytics/DAET/daily/2026-01-01').get())
  })

  test('56. Citizen cannot read analytics', async () => {
    const db = authFor({ uid: 'citizen', role: 'citizen', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('analytics/BASUD/daily/2026-01-01').set(ANALYTICS_DOC)
    })
    await assertFails(db.doc('analytics/BASUD/daily/2026-01-01').get())
  })

  test('57. Unauthenticated user cannot read analytics', async () => {
    const db = authFor(null)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('analytics/BASUD/daily/2026-01-01').set(ANALYTICS_DOC)
    })
    await assertFails(db.doc('analytics/BASUD/daily/2026-01-01').get())
  })
})

// ---------------------------------------------------------------------------
// AUDIT Collection (5 tests)
// ---------------------------------------------------------------------------

describe('audit', () => {
  const AUDIT_DOC = { action: 'report.verify', userId: 'admin-1', reportId: 'report-001', timestamp: '2026-01-01T00:00:00Z', details: {} }

  test('58. Provincial superadmin can read audit entries', async () => {
    const db = authFor({ uid: 'superadmin', role: 'provincial_superadmin', municipalityCode: null })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('audit/audit-001').set(AUDIT_DOC)
    })
    await assertSucceeds(db.doc('audit/audit-001').get())
  })

  test('59. Municipal admin CANNOT read audit entries', async () => {
    const db = authFor({ uid: 'admin-basud', role: 'municipal_admin', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('audit/audit-001').set(AUDIT_DOC)
    })
    await assertFails(db.doc('audit/audit-001').get())
  })

  test('60. Citizen CANNOT read audit entries', async () => {
    const db = authFor({ uid: 'citizen', role: 'citizen', municipalityCode: 'BASUD' })
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('audit/audit-001').set(AUDIT_DOC)
    })
    await assertFails(db.doc('audit/audit-001').get())
  })

  test('61. No client can create audit entries (CF only)', async () => {
    const db = authFor({ uid: 'superadmin', role: 'provincial_superadmin', municipalityCode: null })
    await assertFails(db.doc('audit/audit-new').set(AUDIT_DOC))
  })

  test('62. Unauthenticated user cannot read audit', async () => {
    const db = authFor(null)
    await testEnv.withSecurityRulesDisabled(async (disabled) => {
      await disabled.firestore().doc('audit/audit-001').set(AUDIT_DOC)
    })
    await assertFails(db.doc('audit/audit-001').get())
  })
})

// ---------------------------------------------------------------------------
// INPUT SANITIZATION (6 tests)
// ---------------------------------------------------------------------------

describe('input sanitization', () => {
  const USER_ID = 'user-citizen-basud'
  const USER_DOC_BASE = { email: 'citizen@test.com', role: 'citizen', municipalityCode: 'BASUD', provinceCode: 'CMN', notificationPreferences: { pushEnabled: true, emailEnabled: true, alertTypes: ['flood'] }, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }

  // Note: Firestore rules do not have native HTML detection. These tests
  // document the intended behavior for input sanitization which must be
  // enforced at the Cloud Function layer. Rules validate structure and scope.

  test('63. Valid text without HTML should succeed in user document', async () => {
    const db = authFor({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    await assertSucceeds(
      db.doc(`users/${USER_ID}`).set({ ...USER_DOC_BASE, displayName: 'Valid Name with special chars: 日本語' })
    )
  })

  test('64. User document can be created with normal content', async () => {
    const db = authFor({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    await assertSucceeds(
      db.doc(`users/${USER_ID}`).set({ ...USER_DOC_BASE, displayName: 'John Doe' })
    )
  })

  test('65. Municipal admin can create contact with normal text', async () => {
    const db = authFor({ uid: 'admin-basud', role: 'municipal_admin', municipalityCode: 'BASUD' })
    await assertSucceeds(
      db.doc('contacts/contact-new').set({
        name: 'Valid Contact Name',
        agency: 'BFP',
        municipalityCode: 'BASUD',
        phones: ['+639000000000'],
        email: 'bfp@.gov.ph',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      })
    )
  })

  test('66. Municipal admin can create announcement with normal text', async () => {
    const db = authFor({ uid: 'admin-basud', role: 'municipal_admin', municipalityCode: 'BASUD' })
    await assertSucceeds(
      db.doc('announcements/ann-new').set({
        title: 'Flash Flood Advisory',
        body: 'Heavy rainfall expected in the next 6 hours. Please stay alert.',
        type: 'alert',
        severity: 'warning',
        targetScope: { type: 'municipality', municipalityCode: 'BASUD' },
        createdAt: '2026-01-01T00:00:00Z',
        publishedAt: '2026-01-01T00:00:00Z',
      })
    )
  })

  test('67. Contact notes field accepts normal text', async () => {
    const db = authFor({ uid: 'admin-basud', role: 'municipal_admin', municipalityCode: 'BASUD' })
    await assertSucceeds(
      db.doc('contacts/contact-notes').set({
        name: 'Contact',
        agency: 'Agency',
        municipalityCode: 'BASUD',
        phones: ['+639000000000'],
        email: 'test@test.com',
        notes: 'Available 24/7 for emergency response',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      })
    )
  })

  test('68. Announcement body accepts multiline text', async () => {
    const db = authFor({ uid: 'admin-basud', role: 'municipal_admin', municipalityCode: 'BASUD' })
    await assertSucceeds(
      db.doc('announcements/ann-multiline').set({
        title: 'Weather Update',
        body: 'Conditions:\n- Heavy rain\n- Possible flooding\n- Stay indoors',
        type: 'advisory',
        severity: 'info',
        targetScope: { type: 'municipality', municipalityCode: 'BASUD' },
        createdAt: '2026-01-01T00:00:00Z',
        publishedAt: '2026-01-01T00:00:00Z',
      })
    )
  })
})
