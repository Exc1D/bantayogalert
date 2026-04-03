import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { z } from 'zod'

// ─── Municipality catalog ─────────────────────────────────────────────────────
const municipalities = [
  { code: 'bas', name: 'Basud',          lat: 14.0522, lng: 122.8764 },
  { code: 'bat', name: 'Batobal',        lat: 14.1139, lng: 122.7533 },
  { code: 'cams', name: 'Camaligan',     lat: 13.9711, lng: 122.9636 },
  { code: 'cap', name: 'Capalonga',      lat: 14.2917, lng: 122.4853 },
  { code: 'daet', name: 'Daet',          lat: 14.1022, lng: 122.9136 },
  { code: 'jmo', name: 'Jose Panganiban', lat: 14.2972, lng: 122.6828 },
  { code: 'labo', name: 'Labo',          lat: 14.1822, lng: 122.8250 },
  { code: 'mer', name: 'Mercedes',       lat: 14.0878, lng: 123.0083 },
  { code: 'san', name: 'San Lorenzo Ruiz', lat: 14.1556, lng: 122.7833 },
  { code: 'sip', name: 'Sipocot',        lat: 13.9481, lng: 122.9908 },
  { code: 'sta', name: 'Sta Elena',      lat: 14.0450, lng: 122.7933 },
  { code: 'vin', name: 'Vinzons',        lat: 14.1822, lng: 122.8667 },
] as const

const MunicipalitySchema = z.object({
  code: z.string().min(3).max(4),
  name: z.string().min(1).max(100),
  center: z.object({ lat: z.number(), lng: z.number() }),
})

// ─── Barangay catalog (representative sample 5-8 per municipality) ───────────
const barangayData: Record<string, { name: string; num: number }[]> = {
  bas: [
    { name: 'An-na', num: 1 }, { name: 'Bachaw', num: 2 }, { name: 'Caorasan', num: 3 },
    { name: 'Guinacuitan', num: 4 }, { name: 'Libertad', num: 5 }, { name: 'Mampot', num: 6 }, { name: 'Mina', num: 7 },
  ],
  bat: [
    { name: 'Balat-Balat', num: 1 }, { name: 'Binanuaanan', num: 2 }, { name: 'Carumpit', num: 3 },
    { name: 'Danlog', num: 4 }, { name: 'Maya', num: 5 }, { name: 'Poblacion', num: 6 }, { name: 'Tapis', num: 7 }, { name: 'Tukukan', num: 8 },
  ],
  cams: [
    { name: 'Cagbinanga', num: 1 }, { name: 'Calampuyo', num: 2 }, { name: 'Dugui', num: 3 },
    { name: 'Maysalug', num: 4 }, { name: 'Poblacion', num: 5 }, { name: 'Suclab', num: 6 },
  ],
  cap: [
    { name: 'Alayao', num: 1 }, { name: 'Bangon', num: 2 }, { name: 'Bo. Type', num: 3 },
    { name: 'Cabella', num: 4 }, { name: 'Migsac', num: 5 }, { name: 'Poblacion', num: 6 }, { name: 'Tanawan', num: 7 }, { name: 'Villa Bel', num: 8 },
  ],
  daet: [
    { name: 'Alawihao', num: 1 }, { name: 'Baga', num: 2 }, { name: 'Borabod', num: 3 },
    { name: 'Cawacagan', num: 4 }, { name: 'Centro', num: 5 }, { name: 'Dagot', num: 6 }, { name: 'Mambayleyogan', num: 7 }, { name: 'Pamorangon', num: 8 },
  ],
  jmo: [
    { name: 'Bgy. 1', num: 1 }, { name: 'Bgy. 2', num: 2 }, { name: 'Bgy. 3', num: 3 },
    { name: 'Bgy. 4', num: 4 }, { name: 'Bgy. 5', num: 5 }, { name: 'Lahing', num: 6 }, { name: 'Mabula', num: 7 }, { name: 'Ngarag', num: 8 },
  ],
  labo: [
    { name: 'Anahaw', num: 1 }, { name: 'Bagacay', num: 2 }, { name: 'Baay', num: 3 },
    { name: 'Bakiad', num: 4 }, { name: 'Binandina', num: 5 }, { name: 'Poblacion', num: 6 }, { name: 'San Roque', num: 7 }, { name: 'Santa Cruz', num: 8 },
  ],
  mer: [
    { name: 'Cagbunga', num: 1 }, { name: 'Cagumit', num: 2 }, { name: 'Maddela', num: 3 },
    { name: 'Poblacion', num: 4 }, { name: 'San Roque', num: 5 }, { name: 'Sta. Elena', num: 6 },
  ],
  san: [
    { name: 'Bebac', num: 1 }, { name: 'Collong', num: 2 }, { name: 'Dacu', num: 3 },
    { name: 'Guit guit', num: 4 }, { name: 'Manlabang', num: 5 }, { name: 'Poblacion', num: 6 }, { name: 'Saban', num: 7 }, { name: 'Talisay', num: 8 },
  ],
  sip: [
    { name: 'Buenavista', num: 1 }, { name: 'Cagaluan', num: 2 }, { name: 'Caray', num: 3 },
    { name: 'Luna', num: 4 }, { name: 'Poblacion', num: 5 }, { name: 'Rizal', num: 6 }, { name: 'Salvacion', num: 7 }, { name: 'Santo Niño', num: 8 },
  ],
  sta: [
    { name: 'Bagumbayan', num: 1 }, { name: 'Barangay 1', num: 2 }, { name: 'Bir女星', num: 3 },
    { name: 'Ginea', num: 4 }, { name: 'Jaya', num: 5 }, { name: 'Poblacion', num: 6 }, { name: 'Rizal', num: 7 }, { name: 'Villa Paz', num: 8 },
  ],
  vin: [
    { name: 'Banawang', num: 1 }, { name: 'Barangay 1', num: 2 }, { name: 'Cagborogan', num: 3 },
    { name: 'Mangca', num: 4 }, { name: 'Manhulug', num: 5 }, { name: 'Poblacion', num: 6 }, { name: 'Singi', num: 7 }, { name: 'Tamong', num: 8 },
  ],
}

// ─── Firebase init ────────────────────────────────────────────────────────────
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
process.env.GCLOUD_PROJECT = 'demo-bantayogalert'
const app = getApps().length ? getApps()[0] : initializeApp({ projectId: 'demo-bantayogalert' })
const db = getFirestore(app)

function zeroPad(num: number, size: number): string {
  return String(num).padStart(size, '0')
}

async function main() {
  const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? 'localhost:8080'
  console.log(`[seed-catalog] Starting seed against emulator: ${FIRESTORE_EMULATOR_HOST}`)
  console.log(`[seed-catalog] Will seed ${municipalities.length} municipalities`)

  for (const m of municipalities) {
    const muniRef = db.collection('municipalities').doc(m.code)
    const muniData = {
      code: m.code,
      name: m.name,
      center: { lat: m.lat, lng: m.lng },
      isSetup: true,
      createdAt: new Date().toISOString(),
    }

    const validated = MunicipalitySchema.parse(muniData)
    await muniRef.set(validated)
    console.log(`  [municipality] ${m.code} – ${m.name}`)

    const barangays = barangayData[m.code] ?? []
    for (const b of barangays) {
      const brgyCode = `${m.code}${zeroPad(b.num, 3)}`
      const brgyRef = muniRef.collection('barangays').doc(brgyCode)
      await brgyRef.set({
        code: brgyCode,
        municipalityCode: m.code,
        name: b.name,
        createdAt: new Date().toISOString(),
      })
    }
    console.log(`    → ${barangays.length} barangays seeded`)
  }

  console.log('[seed-catalog] Done.')
}

main().catch((err) => {
  console.error('[seed-catalog] Fatal:', err)
  process.exit(1)
})
