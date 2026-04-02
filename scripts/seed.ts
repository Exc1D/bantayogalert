/**
 * BantayogAlert — Firestore + Auth Seed Script
 *
 * Usage:
 *   npm run seed
 *
 * Requires emulators running:
 *   npm run emulators:start
 *
 * Connects Admin SDK directly to local emulator ports.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { connectFirestoreEmulator } from 'firebase-admin/firestore'
import { connectAuthEmulator } from 'firebase-admin/auth'
import { connectStorageEmulator } from 'firebase-admin/storage'
import { encode as encodeGeohash } from 'ngeohash'

// ─── Firebase Admin Init ──────────────────────────────────────────────────

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0]!

  const serviceAccount = {
    projectId: 'bantayogalert',
    clientEmail: 'firebase-adminsdk@bantayogalert.iam.gserviceaccount.com',
    // Dummy key — emulator doesn't validate tokens, only checks projectId match
    privateKey: '-----BEGIN RSA PRIVATE KEY-----\nDUMMY\n-----END RSA PRIVATE KEY-----',
  }

  const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'bantayogalert.firebasestorage.app',
  })

  // Connect Admin SDK to local emulators
  connectFirestoreEmulator(getFirestore(app), 'localhost', 8080)
  connectAuthEmulator(getAuth(app), 'http://localhost:9099', { disableWarnings: true })
  connectStorageEmulator(getStorage(app), 'localhost', 9199)

  return app
}

const adminApp = getAdminApp()
const db = getFirestore(adminApp)
const auth = getAuth(adminApp)

// ─── Test Data ─────────────────────────────────────────────────────────────

const REPORT_TYPES = ['flood', 'landslide', 'fire', 'earthquake', 'medical', 'crime', 'infrastructure', 'other'] as const
const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function daysAgo(n: number): Timestamp {
  return Timestamp.fromDate(new Date(Date.now() - n * 864e5))
}

// ─── Clear existing data ──────────────────────────────────────────────────

async function clearData() {
  console.log('🗑️  Clearing existing emulator data...')
  const reportsSnap = await db.collection('reports').get()
  const batch = db.batch()
  reportsSnap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
  console.log(`   Deleted ${reportsSnap.size} reports`)

  const announcementsSnap = await db.collection('announcements').get()
  const annBatch = db.batch()
  announcementsSnap.docs.forEach((d) => annBatch.delete(d.ref))
  await annBatch.commit()
  console.log(`   Deleted ${announcementsSnap.size} announcements`)
}

// ─── Create Users ─────────────────────────────────────────────────────────

interface TestUser {
  uid: string
  email: string
  displayName: string
  role: 'citizen' | 'municipal_admin' | 'provincial_superadmin'
  municipality?: string
  password: string
}

const TEST_USERS: TestUser[] = [
  {
    uid: 'prov-admin-001',
    email: 'provincial@bantayogalert.dev',
    displayName: 'Provincial Admin',
    role: 'provincial_superadmin',
    password: 'Test@1234',
  },
  {
    uid: 'daet-admin-001',
    email: 'daet.admin@bantayogalert.dev',
    displayName: 'Daet Municipal Admin',
    role: 'municipal_admin',
    municipality: 'daet',
    password: 'Test@1234',
  },
  {
    uid: 'mercedes-admin-001',
    email: 'mercedes.admin@bantayogalert.dev',
    displayName: 'Mercedes Municipal Admin',
    role: 'municipal_admin',
    municipality: 'mercedes',
    password: 'Test@1234',
  },
  {
    uid: 'citizen-daet-001',
    email: 'citizen.daet@bantayogalert.dev',
    displayName: 'Juan Dela Cruz',
    role: 'citizen',
    municipality: 'daet',
    password: 'Test@1234',
  },
  {
    uid: 'citizen-mercedes-001',
    email: 'citizen.mercedes@bantayogalert.dev',
    displayName: 'Maria Santos',
    role: 'citizen',
    municipality: 'mercedes',
    password: 'Test@1234',
  },
  {
    uid: 'citizen-labo-001',
    email: 'citizen.labo@bantayogalert.dev',
    displayName: 'Pedro Garcia',
    role: 'citizen',
    municipality: 'labo',
    password: 'Test@1234',
  },
]

async function seedUsers() {
  console.log('\n👤 Creating test users...')
  for (const u of TEST_USERS) {
    try {
      await auth.createUser({ uid: u.uid, email: u.email, displayName: u.displayName, password: u.password })
      console.log(`   ✓ Created: ${u.email}`)
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'auth/uid-already-exists') {
        console.log(`   → Exists: ${u.email}`)
      } else throw e
    }

    const claims: Record<string, unknown> = { role: u.role }
    if (u.municipality) claims.municipality = u.municipality
    await auth.setCustomUserClaims(u.uid, claims)
    console.log(`   ✓ Claims (${u.email}):`, claims)
  }
}

// ─── Reports ───────────────────────────────────────────────────────────────

interface ReportSeed {
  id: string
  submitterUid: string
  submitterName: string
  submitterAnonymous: boolean
  type: string
  severity: string
  status: string
  description: string
  lat: number
  lng: number
  barangay: string
  municipality: string
  createdDaysAgo: number
  updatedDaysAgo: number
  verifiedBy?: string
  verifiedAtDaysAgo?: number
  rejectedBy?: string
  rejectedAtDaysAgo?: number
  rejectedReason?: string
  dispatchedTo?: string
  acknowledgedBy?: string
  acknowledgedAtDaysAgo?: number
  inProgressBy?: string
  inProgressAtDaysAgo?: number
  resolvedBy?: string
  resolvedAtDaysAgo?: number
  resolvedNotes?: string
}

const REPORTS: ReportSeed[] = [
  // ── Daet ──────────────────────────────────────────────────────────────
  {
    id: 'rpt-001',
    submitterUid: 'citizen-daet-001',
    submitterName: 'Juan Dela Cruz',
    submitterAnonymous: false,
    type: 'flood',
    severity: 'high',
    status: 'pending',
    description: 'Severe flooding at Centro Street near the market. Water level is waist-deep and rising. Multiple families trapped on upper floors. Emergency assistance needed immediately.',
    lat: 14.2972,
    lng: 122.9516,
    barangay: 'Centro',
    municipality: 'daet',
    createdDaysAgo: 0,
    updatedDaysAgo: 0,
  },
  {
    id: 'rpt-002',
    submitterUid: 'citizen-daet-001',
    submitterName: 'Juan Dela Cruz',
    submitterAnonymous: false,
    type: 'fire',
    severity: 'critical',
    status: 'verified',
    description: 'Structure fire at Purok 3, Bonifacio barangay. Thick black smoke visible from 2km away. Multiple houses may be affected.',
    lat: 14.2950,
    lng: 122.9500,
    barangay: 'Bonifacio',
    municipality: 'daet',
    createdDaysAgo: 1,
    updatedDaysAgo: 0,
    verifiedBy: 'daet-admin-001',
    verifiedAtDaysAgo: 0,
  },
  {
    id: 'rpt-003',
    submitterUid: 'citizen-daet-001',
    submitterName: 'Anonymous',
    submitterAnonymous: true,
    type: 'crime',
    severity: 'medium',
    status: 'dispatched',
    description: 'Suspicious individuals loitering near Daet Central School after hours. Students report feeling unsafe.',
    lat: 14.2990,
    lng: 122.9530,
    barangay: 'Centro',
    municipality: 'daet',
    createdDaysAgo: 2,
    updatedDaysAgo: 0,
    verifiedBy: 'daet-admin-001',
    verifiedAtDaysAgo: 1,
    dispatchedTo: 'Barangay tanod team',
  },
  {
    id: 'rpt-004',
    submitterUid: 'citizen-daet-001',
    submitterName: 'Juan Dela Cruz',
    submitterAnonymous: false,
    type: 'infrastructure',
    severity: 'high',
    status: 'in_progress',
    description: 'Collapsed drainage wall along national highway causing road flooding. Vehicle traffic severely affected.',
    lat: 14.3000,
    lng: 122.9490,
    barangay: 'Mabini',
    municipality: 'daet',
    createdDaysAgo: 3,
    updatedDaysAgo: 1,
    verifiedBy: 'daet-admin-001',
    verifiedAtDaysAgo: 2,
    dispatchedTo: 'DPWH Camarines Norte',
    acknowledgedBy: 'daet-admin-001',
    acknowledgedAtDaysAgo: 1,
    inProgressBy: 'daet-admin-001',
    inProgressAtDaysAgo: 1,
  },
  {
    id: 'rpt-005',
    submitterUid: 'citizen-daet-001',
    submitterName: 'Anonymous',
    submitterAnonymous: true,
    type: 'medical',
    severity: 'critical',
    status: 'resolved',
    description: 'Senior citizen experiencing heart attack symptoms. Responder arrived within 15 minutes and transported to Daet District Hospital.',
    lat: 14.2980,
    lng: 122.9475,
    barangay: 'Quezon',
    municipality: 'daet',
    createdDaysAgo: 5,
    updatedDaysAgo: 4,
    verifiedBy: 'daet-admin-001',
    verifiedAtDaysAgo: 4,
    dispatchedTo: 'Rural Health Unit',
    acknowledgedBy: 'daet-admin-001',
    acknowledgedAtDaysAgo: 4,
    inProgressBy: 'daet-admin-001',
    inProgressAtDaysAgo: 4,
    resolvedBy: 'daet-admin-001',
    resolvedAtDaysAgo: 4,
    resolvedNotes: 'Patient stabilized and transported to hospital. Case closed.',
  },

  // ── Mercedes ───────────────────────────────────────────────────────────
  {
    id: 'rpt-006',
    submitterUid: 'citizen-mercedes-001',
    submitterName: 'Maria Santos',
    submitterAnonymous: false,
    type: 'landslide',
    severity: 'high',
    status: 'pending',
    description: 'Landslide on hillside above Purok 7, San Roque. Ground cracking sounds heard since morning. Three households in potential path.',
    lat: 14.0833,
    lng: 123.0167,
    barangay: 'San Roque',
    municipality: 'mercedes',
    createdDaysAgo: 0,
    updatedDaysAgo: 0,
  },
  {
    id: 'rpt-007',
    submitterUid: 'citizen-mercedes-001',
    submitterName: 'Maria Santos',
    submitterAnonymous: false,
    type: 'flood',
    severity: 'medium',
    status: 'acknowledged',
    description: 'Flash flood from mountain swept through coastal road at Luzviminda. Motorcycles having difficulty crossing. No injuries.',
    lat: 14.0850,
    lng: 123.0200,
    barangay: 'Luzviminda',
    municipality: 'mercedes',
    createdDaysAgo: 1,
    updatedDaysAgo: 0,
    verifiedBy: 'mercedes-admin-001',
    verifiedAtDaysAgo: 0,
    dispatchedTo: 'MDRRMO Mercedes',
    acknowledgedBy: 'mercedes-admin-001',
    acknowledgedAtDaysAgo: 0,
  },
  {
    id: 'rpt-008',
    submitterUid: 'citizen-mercedes-001',
    submitterName: 'Anonymous',
    submitterAnonymous: true,
    type: 'crime',
    severity: 'low',
    status: 'rejected',
    description: 'Alleged illegal fishing using dynamite. No direct witness, only heard loud explosion from sea at ~2am.',
    lat: 14.0880,
    lng: 123.0100,
    barangay: 'Embarcadero',
    municipality: 'mercedes',
    createdDaysAgo: 4,
    updatedDaysAgo: 3,
    verifiedBy: 'mercedes-admin-001',
    verifiedAtDaysAgo: 3,
    rejectedBy: 'mercedes-admin-001',
    rejectedAtDaysAgo: 3,
    rejectedReason: 'Unverified complaint — no credible evidence or witnesses.',
  },

  // ── Labo ───────────────────────────────────────────────────────────────
  {
    id: 'rpt-009',
    submitterUid: 'citizen-labo-001',
    submitterName: 'Pedro Garcia',
    submitterAnonymous: false,
    type: 'landslide',
    severity: 'critical',
    status: 'verified',
    description: 'Major landslide blocking main provincial road to Labo town proper. Entire hillside gave way after heavy rain. No casualties but hundreds stranded.',
    lat: 14.1789,
    lng: 122.8231,
    barangay: 'Bagong Silang',
    municipality: 'labo',
    createdDaysAgo: 2,
    updatedDaysAgo: 1,
    verifiedBy: 'daet-admin-001',
    verifiedAtDaysAgo: 1,
  },
  {
    id: 'rpt-010',
    submitterUid: 'citizen-labo-001',
    submitterName: 'Anonymous',
    submitterAnonymous: true,
    type: 'medical',
    severity: 'high',
    status: 'pending',
    description: 'Child with severe dengue fever in remote barangay Maidag. Parents cannot afford hospital transport. Child febrile for 5 days.',
    lat: 14.1700,
    lng: 122.8300,
    barangay: 'Maidag',
    municipality: 'labo',
    createdDaysAgo: 0,
    updatedDaysAgo: 0,
  },

  // ── Other municipalities ──────────────────────────────────────────────
  {
    id: 'rpt-011',
    submitterUid: 'citizen-labo-001',
    submitterName: 'Pedro Garcia',
    submitterAnonymous: false,
    type: 'earthquake',
    severity: 'medium',
    status: 'resolved',
    description: 'Residents felt tremors around 3pm. Some cracks in old walls of traditional houses in Poblacion. No major damage observed.',
    lat: 14.2833,
    lng: 122.7833,
    barangay: 'Poblacion',
    municipality: 'parcale',
    createdDaysAgo: 7,
    updatedDaysAgo: 6,
    verifiedBy: 'daet-admin-001',
    verifiedAtDaysAgo: 6,
    dispatchedTo: 'MDRRMO Paracale',
    acknowledgedBy: 'daet-admin-001',
    acknowledgedAtDaysAgo: 6,
    inProgressBy: 'daet-admin-001',
    inProgressAtDaysAgo: 6,
    resolvedBy: 'daet-admin-001',
    resolvedAtDaysAgo: 6,
    resolvedNotes: 'Inspection done. Minor cracks only. Area declared safe.',
  },
  {
    id: 'rpt-012',
    submitterUid: 'citizen-labo-001',
    submitterName: 'Anonymous',
    submitterAnonymous: true,
    type: 'infrastructure',
    severity: 'low',
    status: 'pending',
    description: 'Broken street light on national highway near Talisay town proper. Area very dark and dangerous at night. Several near-accidents reported.',
    lat: 14.1167,
    lng: 122.9667,
    barangay: 'Poblacion',
    municipality: 'talisay',
    createdDaysAgo: 1,
    updatedDaysAgo: 1,
  },
]

async function seedReports() {
  console.log('\n📋 Creating test reports...')
  for (const r of REPORTS) {
    const PUBLIC_STATUS: Record<string, string> = {
      pending: 'Pending Review',
      verified: 'Verified',
      rejected: 'Rejected',
      dispatched: 'Responder Dispatched',
      acknowledged: 'Responder En Route',
      in_progress: 'Situation Being Addressed',
      resolved: 'Resolved',
    }

    const docData: Record<string, unknown> = {
      type: r.type,
      category: r.type,
      severity: r.severity,
      status: r.status,
      publicStatus: PUBLIC_STATUS[r.status] ?? r.status,
      description: r.description,
      location: {
        lat: r.lat,
        lng: r.lng,
        barangay: r.barangay,
        municipality: r.municipality,
        geohash: encodeGeohash(r.lat, r.lng, 8),
      },
      mediaUrls: [],
      mediaUploadStatus: 'pending',
      submitterUid: r.submitterUid,
      submitterName: r.submitterName,
      submitterAnonymous: r.submitterAnonymous,
      assignedMunicipality: r.municipality,
      createdAt: daysAgo(r.createdDaysAgo),
      updatedAt: daysAgo(r.updatedDaysAgo),
      verifiedBy: r.verifiedBy ?? null,
      verifiedAt: r.verifiedAtDaysAgo != null ? daysAgo(r.verifiedAtDaysAgo) : null,
      rejectedBy: r.rejectedBy ?? null,
      rejectedAt: r.rejectedAtDaysAgo != null ? daysAgo(r.rejectedAtDaysAgo) : null,
      rejectedReason: r.rejectedReason ?? null,
      dispatchedTo: r.dispatchedTo ?? null,
      acknowledgedBy: r.acknowledgedBy ?? null,
      acknowledgedAt: r.acknowledgedAtDaysAgo != null ? daysAgo(r.acknowledgedAtDaysAgo) : null,
      inProgressBy: r.inProgressBy ?? null,
      inProgressAt: r.inProgressAtDaysAgo != null ? daysAgo(r.inProgressAtDaysAgo) : null,
      resolvedBy: r.resolvedBy ?? null,
      resolvedAt: r.resolvedAtDaysAgo != null ? daysAgo(r.resolvedAtDaysAgo) : null,
      resolvedNotes: r.resolvedNotes ?? null,
    }

    await db.collection('reports').doc(r.id).set(docData)
    console.log(`   ✓ ${r.id}: ${r.type}/${r.severity} [${r.status}] — ${r.municipality}`)
  }
}

// ─── Announcements ────────────────────────────────────────────────────────

async function seedAnnouncements() {
  console.log('\n📢 Creating sample announcements...')
  const now = Timestamp.now()
  const announcements = [
    {
      id: 'ann-001',
      title: 'Provincial Disaster Preparedness Guidelines 2026',
      content: 'All municipalities are advised to review and update their disaster response plans before the rainy season. Municipal admins should ensure all responders are trained and equipment is functional.',
      priority: 'high',
      active: true,
      createdAt: now,
      createdBy: 'prov-admin-001',
      createdByName: 'Provincial Admin',
      municipalities: ['all'],
    },
    {
      id: 'ann-002',
      title: 'Labo Road Closure — Landslide Clearing in Progress',
      content: 'The provincial road to Labo is currently closed due to landslide clearing operations. Estimated reopening within 48 hours. Motorists advised to use alternate routes via Basud.',
      priority: 'high',
      active: true,
      createdAt: daysAgo(1),
      createdBy: 'prov-admin-001',
      createdByName: 'Provincial Admin',
      municipalities: ['labo', 'basud', 'daet'],
    },
  ]

  for (const ann of announcements) {
    await db.collection('announcements').doc(ann.id).set(ann)
    console.log(`   ✓ ${ann.title}`)
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  BantayogAlert — Firestore Seed Script')
  console.log('═══════════════════════════════════════════')
  console.log('')
  console.log('⚠️  Make sure emulators are running first:')
  console.log('   npm run emulators:start')
  console.log('')

  await clearData()
  await seedUsers()
  await seedReports()
  await seedAnnouncements()

  console.log('')
  console.log('✅ Seed complete!')
  console.log('')
  console.log('Test accounts:')
  console.log('  Provincial admin:  provincial@bantayogalert.dev / Test@1234')
  console.log('  Daet admin:        daet.admin@bantayogalert.dev / Test@1234')
  console.log('  Mercedes admin:    mercedes.admin@bantayogalert.dev / Test@1234')
  console.log('  Citizen (Daet):    citizen.daet@bantayogalert.dev / Test@1234')
  console.log('  Citizen (Mercedes):citizen.mercedes@bantayogalert.dev / Test@1234')
  console.log('  Citizen (Labo):    citizen.labo@bantayogalert.dev / Test@1234')
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
