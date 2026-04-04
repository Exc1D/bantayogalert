/**
 * Storage Security Rules Test Suite
 * Tests file type, size limits, and path ownership for Storage rules.
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
    storage: {
      host: 'localhost',
      port: 9199,
      rules: readFileSync(join(projectRoot, 'storage.rules'), 'utf8'),
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

// ---------------------------------------------------------------------------
// Helper: Build Storage references with different auth states
// ---------------------------------------------------------------------------

type AuthSpec =
  | { uid: string; role: 'citizen'; municipalityCode: string }
  | { uid: string; role: 'municipal_admin'; municipalityCode: string }
  | { uid: string; role: 'provincial_superadmin'; municipalityCode: null }
  | null // unauthenticated

function authStorage(spec: AuthSpec) {
  if (!spec) return testEnv.unauthenticatedContext().storage()
  const token: Record<string, unknown> = { sub: spec.uid, role: spec.role }
  if (spec.municipalityCode) token.municipalityCode = spec.municipalityCode
  return testEnv.authenticatedContext(spec.uid, token).storage()
}

// UploadTask is thenable but not a Promise — wrap for assertSucceeds/assertFails
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function uploadAsPromise(uploadTask: any) {
  return Promise.resolve(uploadTask)
}

// ---------------------------------------------------------------------------
// USER PROFILE IMAGES (6 tests)
// ---------------------------------------------------------------------------

describe('User profile images', () => {
  const USER_ID = 'user-123'
  const OTHER_USER = 'user-456'

  // Helper to create a mock file with given content type and size
  function makeFile(contentType: string, size: number) {
    return {
      contentType,
      size,
      data: Buffer.alloc(size),
    }
  }

  test('1. Owner can upload JPEG profile image', async () => {
    const storage = authStorage({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/users/${USER_ID}/profile/photo.jpg`)
    await assertSucceeds(uploadAsPromise(ref.put(makeFile('image/jpeg', 1024 * 500) as unknown as Blob)))
  })

  test('2. Owner can upload PNG profile image', async () => {
    const storage = authStorage({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/users/${USER_ID}/profile/photo.png`)
    await assertSucceeds(uploadAsPromise(ref.put(makeFile('image/png', 1024 * 500) as unknown as Blob)))
  })

  test('3. Owner can upload WebP profile image', async () => {
    const storage = authStorage({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/users/${USER_ID}/profile/photo.webp`)
    await assertSucceeds(uploadAsPromise(ref.put(makeFile('image/webp', 1024 * 500) as unknown as Blob)))
  })

  test('4. Owner CANNOT upload non-image file', async () => {
    const storage = authStorage({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/users/${USER_ID}/profile/doc.pdf`)
    await assertFails(uploadAsPromise(ref.put(makeFile('application/pdf', 1024 * 500) as unknown as Blob)))
  })

  test('5. Owner CANNOT upload file over 10MB', async () => {
    const storage = authStorage({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/users/${USER_ID}/profile/photo.jpg`)
    // 10MB + 1 byte
    await assertFails(uploadAsPromise(ref.put(makeFile('image/jpeg', 10 * 1024 * 1024 + 1) as unknown as Blob)))
  })

  test('6. Owner at exactly 10MB boundary can upload', async () => {
    const storage = authStorage({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/users/${USER_ID}/profile/photo.jpg`)
    // Exactly 10MB
    await assertSucceeds(uploadAsPromise(ref.put(makeFile('image/jpeg', 10 * 1024 * 1024) as unknown as Blob)))
  })

  test('7. Non-owner CANNOT upload to another user profile path', async () => {
    const storage = authStorage({ uid: OTHER_USER, role: 'citizen', municipalityCode: 'DAET' })
    const ref = storage.ref(`/users/${USER_ID}/profile/photo.jpg`)
    await assertFails(uploadAsPromise(ref.put(makeFile('image/jpeg', 1024 * 500) as unknown as Blob)))
  })

  test('8. Unauthenticated user CANNOT upload profile image', async () => {
    const storage = authStorage(null)
    const ref = storage.ref(`/users/${USER_ID}/profile/photo.jpg`)
    await assertFails(uploadAsPromise(ref.put(makeFile('image/jpeg', 1024 * 500) as unknown as Blob)))
  })

  test('9. Any authenticated user can read profile images', async () => {
    const storage = authStorage({ uid: OTHER_USER, role: 'citizen', municipalityCode: 'DAET' })
    const ref = storage.ref(`/users/${USER_ID}/profile/photo.jpg`)
    await assertSucceeds(ref.getDownloadURL())
  })
})

// ---------------------------------------------------------------------------
// REPORT MEDIA (5 tests)
// ---------------------------------------------------------------------------

describe('Report media', () => {
  const REPORT_ID = 'report-abc'
  const USER_ID = 'user-123'

  function makeFile(contentType: string, size: number) {
    return {
      contentType,
      size,
      data: Buffer.alloc(size),
    }
  }

  test('10. Authenticated user can upload JPEG to report media path', async () => {
    const storage = authStorage({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/reports/${REPORT_ID}/media/photo.jpg`)
    await assertSucceeds(uploadAsPromise(ref.put(makeFile('image/jpeg', 1024 * 500) as unknown as Blob)))
  })

  test('11. Authenticated user CANNOT upload non-image to report media', async () => {
    const storage = authStorage({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/reports/${REPORT_ID}/media/video.mp4`)
    await assertFails(uploadAsPromise(ref.put(makeFile('video/mp4', 1024 * 500) as unknown as Blob)))
  })

  test('12. Authenticated user CANNOT upload file over 10MB to report media', async () => {
    const storage = authStorage({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/reports/${REPORT_ID}/media/photo.jpg`)
    await assertFails(uploadAsPromise(ref.put(makeFile('image/jpeg', 10 * 1024 * 1024 + 1) as unknown as Blob)))
  })

  test('13. Any authenticated user can read report media', async () => {
    const storage = authStorage({ uid: 'any-user', role: 'citizen', municipalityCode: 'DAET' })
    const ref = storage.ref(`/reports/${REPORT_ID}/media/photo.jpg`)
    await assertSucceeds(ref.getDownloadURL())
  })

  test('14. Unauthenticated user CANNOT upload report media', async () => {
    const storage = authStorage(null)
    const ref = storage.ref(`/reports/${REPORT_ID}/media/photo.jpg`)
    await assertFails(uploadAsPromise(ref.put(makeFile('image/jpeg', 1024 * 500) as unknown as Blob)))
  })
})

// ---------------------------------------------------------------------------
// CONTACT AVATARS (4 tests)
// ---------------------------------------------------------------------------

describe('Contact avatars', () => {
  const CONTACT_ID = 'contact-xyz'

  function makeFile(contentType: string, size: number) {
    return {
      contentType,
      size,
      data: Buffer.alloc(size),
    }
  }

  test('15. Authenticated user can upload contact avatar (JPEG)', async () => {
    const storage = authStorage({ uid: 'admin-1', role: 'municipal_admin', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/contacts/${CONTACT_ID}/avatar/photo.jpg`)
    await assertSucceeds(uploadAsPromise(ref.put(makeFile('image/jpeg', 1024 * 500) as unknown as Blob)))
  })

  test('16. Authenticated user CANNOT upload non-image as contact avatar', async () => {
    const storage = authStorage({ uid: 'admin-1', role: 'municipal_admin', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/contacts/${CONTACT_ID}/avatar/doc.pdf`)
    await assertFails(uploadAsPromise(ref.put(makeFile('application/pdf', 1024 * 500) as unknown as Blob)))
  })

  test('17. Authenticated user CANNOT upload file over 10MB as contact avatar', async () => {
    const storage = authStorage({ uid: 'admin-1', role: 'municipal_admin', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/contacts/${CONTACT_ID}/avatar/photo.jpg`)
    await assertFails(uploadAsPromise(ref.put(makeFile('image/jpeg', 10 * 1024 * 1024 + 1) as unknown as Blob)))
  })

  test('18. Unauthenticated user CANNOT upload contact avatar', async () => {
    const storage = authStorage(null)
    const ref = storage.ref(`/contacts/${CONTACT_ID}/avatar/photo.jpg`)
    await assertFails(uploadAsPromise(ref.put(makeFile('image/jpeg', 1024 * 500) as unknown as Blob)))
  })
})

// ---------------------------------------------------------------------------
// FILE SIZE EDGE CASES (3 tests)
// ---------------------------------------------------------------------------

describe('File size edge cases', () => {
  const USER_ID = 'user-edge'

  function makeFile(contentType: string, size: number) {
    return {
      contentType,
      size,
      data: Buffer.alloc(size),
    }
  }

  test('19. File exactly at 10MB boundary fails (10MB + 1 byte)', async () => {
    const storage = authStorage({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/users/${USER_ID}/profile/photo.jpg`)
    await assertFails(uploadAsPromise(ref.put(makeFile('image/jpeg', 10 * 1024 * 1024 + 1) as unknown as Blob)))
  })

  test('20. File at 9.9MB should succeed', async () => {
    const storage = authStorage({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/users/${USER_ID}/profile/photo.jpg`)
    const size = Math.floor(10 * 1024 * 1024 * 0.99)
    await assertSucceeds(uploadAsPromise(ref.put(makeFile('image/jpeg', size) as unknown as Blob)))
  })

  test('21. Empty file (0 bytes) should succeed', async () => {
    const storage = authStorage({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/users/${USER_ID}/profile/empty.jpg`)
    await assertSucceeds(uploadAsPromise(ref.put(makeFile('image/jpeg', 0) as unknown as Blob)))
  })
})

// ---------------------------------------------------------------------------
// MIME TYPE VALIDATION (2 tests)
// ---------------------------------------------------------------------------

describe('MIME type validation', () => {
  const USER_ID = 'user-mime'

  function makeFile(contentType: string, size: number) {
    return {
      contentType,
      size,
      data: Buffer.alloc(size),
    }
  }

  test('22. application/octet-stream should fail', async () => {
    const storage = authStorage({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/users/${USER_ID}/profile/photo.jpg`)
    await assertFails(uploadAsPromise(ref.put(makeFile('application/octet-stream', 1024) as unknown as Blob)))
  })

  test('23. text/plain should fail', async () => {
    const storage = authStorage({ uid: USER_ID, role: 'citizen', municipalityCode: 'BASUD' })
    const ref = storage.ref(`/users/${USER_ID}/profile/photo.jpg`)
    await assertFails(uploadAsPromise(ref.put(makeFile('text/plain', 1024) as unknown as Blob)))
  })
})
