# Phase 5: Report Submission - Research

**Researched:** 2026-04-03
**Domain:** React multi-step form, Firebase Storage uploads, Leaflet location picker, IndexedDB persistence
**Confidence:** MEDIUM-HIGH

## Summary

Phase 5 implements the citizen report submission flow. The form is a 4-step wizard (Type+Severity, Description, Location+Media, Review+Submit) rendered inside the existing 480px desktop drawer or a mobile full-screen modal. Cloud Function `submitReport` atomically creates three Firestore documents. Client-side geohash encoding, image compression, and IndexedDB draft auto-save are the three auxiliary concerns. All libraries are established and stable; no experimental technology.

**Primary recommendation:** Use `react-hook-form` with `zodResolver` for per-step validation, `ngeohash` for geohash encoding, `idb` for IndexedDB draft persistence, and Firebase Storage direct upload with `uploadBytes` + `getDownloadURL`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-75:** Report form at `/app/report` route
- **D-76:** Desktop (>=1280px): 480px workspace drawer panel with sticky header + scrolling content
- **D-77:** Mobile (<=768px): full-screen modal sliding up from bottom
- **D-78:** Step-by-step wizard with persistent step indicator
- **D-79:** Each step validates before advancing; "Back" preserves data; "Submit" only on final step
- **D-80:** `LocationPickerMap` at `src/components/map/LocationPickerMap.tsx` — separate MapContainer, draggable marker, `onLocationChange(lat, lng)` callback
- **D-81:** GPS via `navigator.geolocation.getCurrentPosition()`
- **D-83:** Coordinates validated against Camarines Norte bounds (lat 13.8-14.8N, lng 122.3-123.3E)
- **D-85:** Geohash 9-char precision, computed client-side
- **D-86:** File input: `<input type="file" multiple accept="image/jpeg,image/png,image/webp" capture="environment">`
- **D-87:** Compression: `browser-image-compression` — target 1MB max, 1920px longest edge, JPEG/WebP output
- **D-88:** Upload to Firebase Storage at `reports/{reportId}/{filename}` via signed URL or upload token
- **D-90:** Max 5 images (enforced in Zod schema)
- **D-91:** Municipality selector from `MUNICIPALITIES` constant (src/lib/geo/municipality.ts)
- **D-92:** Barangay selector filtered from Firestore `municipalities/{code}/barangays`
- **D-93/D-94:** GPS or manual pin auto-fills municipality/barangay; user can override
- **D-96:** Callable `submitReport` receives: type, severity, description, municipalityCode, barangayCode, exactLocation, mediaUrls[], reporterId
- **D-97:** Function computes geohash from exactLocation for public document
- **D-98:** Three docs atomically via `firestore.runTransaction()`: reports/ (public+pending), report_private/ (exactLocation+ownerStatus), report_ops/ (empty initial)
- **D-99:** Function validates: authenticated, role=citizen, rate limit check
- **D-100:** Rate limiting via CF checking per-user count (already implemented in rateLimit.ts)
- **D-101:** Auto-save to IndexedDB via `idb` library after each step
- **D-102:** Draft key: `report-draft-{userId}`
- **D-103:** On navigating to `/app/report`, prompt resume or start fresh
- **D-104:** Draft cleared on successful submission
- **D-105:** On submit, navigate to `/app/track/{reportId}`
- **D-106:** Report detail page listens to `report_private/{reportId}` via `onSnapshot`
- **D-107:** Initial owner status: "Submitted" from WORKFLOW_TO_OWNER_STATUS[pending]
- Step order: 4 steps (Type+Severity, Description, Location+Media, Review+Submit)
- Compression library: `browser-image-compression`
- Geohash library: `ngeohash`
- Draft persistence: IndexedDB via `idb`
- Step validation: React Hook Form + Zod resolver (per D-23: Zod co-located with interfaces)
- React 18 Strict Mode: Must handle double-invocation of effects

### Claude's Discretion
- Mobile step indicator: compact dot indicator at top (not numbered)
- Compression library: browser-image-compression
- Geohash library: ngeohash
- Drawer on desktop: form header + step indicator sticky at top; form content scrolls
- Photo preview: grid of thumbnails before submit, remove button per photo
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RPT-01 | Citizen can submit report with type, severity, description, location, optional media | React Hook Form multi-step wizard covers all fields; Cloud Function submitReport atomically creates docs |
| RPT-02 | Location picker with Leaflet map pin drop + GPS auto-detect | LocationPickerMap component with draggable Marker; navigator.geolocation.getCurrentPosition() |
| RPT-03 | Municipality and barangay selectors driven by catalog data | MUNICIPALITIES constant + Firestore barangay subcollection; auto-fill from reverse geocode |
| RPT-04 | Coordinate validation within Camarines Norte bounds | Zod schema already has lat 13.8-14.8, lng 122.3-123.3; also validated client-side before submit |
| RPT-05 | Media upload with client-side compression (max 1MB, 1920px, JPEG/WebP) | browser-image-compression with maxSizeMB:1, maxWidthOrHeight:1920, useWebWorker:true |
| RPT-06 | Cloud Function creates three-tier report docs atomically | submitReport uses firestore.runTransaction() to write reports/, report_private/, report_ops/ |
| RPT-07 | Public report uses approximate location (reduced precision); exact in report_private | Geohash 9-char computed client-side; exact lat/lng only in report_private document |
| RPT-08 | Unverified reports hidden from public feed/map | reports/ collection only populated with verified=true; pending reports only in report_private |
| RPT-09 | Reporter can track own pending/rejected reports in Profile | report_private listener filtered by reporterId on /app/track page |
| RPT-10 | Submitting citizen sees own report immediately via report_private listener | onSnapshot on report_private/{reportId} in track page |
| RPT-11 | Submitting citizen receives owner-facing status labels | WORKFLOW_TO_OWNER_STATUS[pending] = "Submitted" displayed on track page |
</phase_requirements>

---

## Standard Stack

### Core (new installs required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-hook-form` | 7.72.1 | Multi-step form state management | Industry standard for React forms; minimal re-renders via ref-based registration |
| `@hookform/resolvers` | 5.2.2 | Zod integration with react-hook-form | Official resolver; works with Zod v4 |
| `ngeohash` | 0.6.3 | Client-side geohash encoding | Lightweight, no dependencies, used per D-85 |
| `idb` | 8.0.3 | IndexedDB wrapper | Clean promise-based API over raw IndexedDB; used per D-101 |

### Already Present (do NOT install)

| Library | Version | Status |
|---------|---------|--------|
| `browser-image-compression` | 2.0.2 | Already in package.json |
| `firebase` (web SDK) | 12.11.0 | Already in package.json |
| `zod` | 4.3.6 | Already in package.json |
| `react-leaflet` | 4.2.1 | Already in package.json |
| `leaflet` | 1.9.4 | Already in package.json |
| `@react-leaflet/core` | 2.1.0 | Already in package.json |

### Installation

```bash
npm install react-hook-form@7.72.1 @hookform/resolvers@5.2.2 ngeohash@0.6.3 idb@8.0.3
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── report/                      # NEW
│       ├── ReportForm.tsx           # Main wizard container (router outlet)
│       ├── steps/                   # NEW
│       │   ├── StepTypeSeverity.tsx # Step 1
│       │   ├── StepDescription.tsx  # Step 2
│       │   ├── StepLocationMedia.tsx # Step 3
│       │   └── StepReview.tsx       # Step 4
│       └── hooks/
│           ├── useReportDraft.ts    # IndexedDB draft persistence
│           └── useSubmitReport.ts    # Callable CF invocation
├── components/
│   └── map/
│       └── LocationPickerMap.tsx   # NEW - embedded Leaflet map with draggable pin
├── features/
│   └── report/
│       ├── ReportFormSchema.ts     # Zod schemas for form validation (per step)
│       └── submitReport.ts         # Client-side CF callable wrapper
functions/src/
├── index.ts                        # Export submitReport
└── reports/
    └── submitReport.ts             # NEW - callable submitReport CF
```

### Pattern 1: React Hook Form Multi-Step Wizard with Per-Step Validation

**What:** Single `useForm` instance spanning all steps; each step validates only its fields before advancing.

**When to use:** The 4-step report form where data must persist across steps and validate progressively.

**Key insight:** Use `trigger(fieldNames)` to validate only current step's fields without triggering full form validation. Each step's fields are registered under flat names like `type`, `severity`, `description`, etc.

**Example:**
```typescript
// ReportFormSchema.ts — Zod schemas per step
import { z } from 'zod'
import { IncidentType, Severity } from '@/types/report'

export const step1Schema = z.object({
  type: z.nativeEnum(IncidentType),
  severity: z.nativeEnum(Severity),
})

export const step2Schema = z.object({
  description: z.string().min(10).max(2000),
})

export const step3Schema = z.object({
  municipalityCode: z.string().min(3).max(4),
  barangayCode: z.string().min(6).max(7),
  location: z.object({
    lat: z.number().min(13.8).max(14.8),
    lng: z.number().min(122.3).max(123.3),
    geohash: z.string().length(9),
  }),
  mediaFiles: z.array(z.instanceof(File)).max(5).optional(),
})

// Merge for final submission
export const fullReportSchema = step1Schema.merge(step2Schema).merge(step3Schema)
```

```typescript
// ReportForm.tsx — Wizard controller
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { fullReportSchema, step1Schema, step2Schema, step3Schema } from './ReportFormSchema'

const steps = ['Type & Severity', 'Description', 'Location & Media', 'Review']

export function ReportForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const form = useForm({
    resolver: zodResolver(fullReportSchema),
    mode: 'onBlur',
  })

  async function handleNext() {
    const schemas = [step1Schema, step2Schema, step3Schema]
    const stepFields = Object.keys(schemas[currentStep].shape)
    const isValid = await form.trigger(stepFields as any)
    if (isValid) setCurrentStep(s => s + 1)
  }

  function handleBack() {
    setCurrentStep(s => s - 1)
  }

  return (
    <div>
      {/* Step indicator */}
      <StepIndicator steps={steps} current={currentStep} />

      {/* Step content — render current step component */}
      {currentStep === 0 && <StepTypeSeverity form={form} />}
      {currentStep === 1 && <StepDescription form={form} />}
      {currentStep === 2 && <StepLocationMedia form={form} />}
      {currentStep === 3 && <StepReview form={form} onSubmit={form.handleSubmit(onSubmit)} />}

      {/* Navigation */}
      <div className="flex gap-2">
        {currentStep > 0 && <button onClick={handleBack}>Back</button>}
        {currentStep < 3 && <button onClick={handleNext}>Next</button>}
        {currentStep === 3 && <button onSubmit={form.handleSubmit(onSubmit)}>Submit</button>}
      </div>
    </div>
  )
}
```

**Source:** react-hook-form v7 documentation — `useForm`, `trigger`, `zodResolver`

---

### Pattern 2: browser-image-compression with Progress Tracking

**What:** Compress images client-side before Firebase Storage upload.

**When to use:** Before uploading media files to `reports/{reportId}/media/`.

**Example:**
```typescript
import imageCompression from 'browser-image-compression'

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    onProgress: (percent: number) => {
      console.log(`Compressing: ${percent}%`)
    },
  }
  return await imageCompression(file, options)
}

// Usage in form submit
const compressedFiles = await Promise.all(
  formData.mediaFiles.map(f => compressImage(f))
)
```

**Source:** browser-image-compression npm — `imageCompression(file, options)` with `maxSizeMB`, `maxWidthOrHeight`, `useWebWorker`, `onProgress`

---

### Pattern 3: ngeohash 9-Character Encoding

**What:** Encode exact coordinates to geohash for the public `reports/` document.

**When to use:** When creating the `location.geohash` field for the public report document.

**Example:**
```typescript
import ngeohash from 'ngeohash'

function encodeGeohash(lat: number, lng: number): string {
  return ngeohash.encode(lat, lng, 9) // 9-char precision (~2m accuracy)
}

// Usage
const geohash = encodeGeohash(exactLocation.lat, exactLocation.lng)
```

**Bounds check (before encoding):**
```typescript
function isInCamarinesNorte(lat: number, lng: number): boolean {
  return lat >= 13.8 && lat <= 14.8 && lng >= 122.3 && lng <= 123.3
}
```

**Source:** ngeohash npm — `encode(latitude, longitude, precision=9)`

---

### Pattern 4: IndexedDB Draft Persistence via idb

**What:** Auto-save form draft to IndexedDB after each step; restore on revisit.

**When to use:** When user abandons form and returns later (D-101 to D-104).

**Example:**
```typescript
// useReportDraft.ts
import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'bantayogalert'
const STORE = 'drafts'
const DRAFT_KEY_PREFIX = 'report-draft-'

interface ReportDraft {
  step1: { type?: string; severity?: string }
  step2: { description?: string }
  step3: { municipalityCode?: string; barangayCode?: string; location?: object }
  currentStep: number
  savedAt: string
}

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE)
    },
  })
}

export async function saveDraft(userId: string, draft: ReportDraft): Promise<void> {
  const db = await getDb()
  await db.put(STORE, draft, DRAFT_KEY_PREFIX + userId)
}

export async function loadDraft(userId: string): Promise<ReportDraft | undefined> {
  const db = await getDb()
  return db.get(STORE, DRAFT_KEY_PREFIX + userId)
}

export async function clearDraft(userId: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE, DRAFT_KEY_PREFIX + userId)
}
```

**React integration (auto-save on step change):**
```typescript
// In ReportForm.tsx
useEffect(() => {
  if (!isLoading && user) {
    saveDraft(user.uid, { step1, step2, step3, currentStep })
  }
}, [currentStep, step1, step2, step3, isLoading, user])
```

**Source:** idb npm — `openDB`, `db.put`, `db.get`, `db.delete`

---

### Pattern 5: Firebase Storage Upload with getDownloadURL

**What:** Upload compressed images to Firebase Storage and get public URLs.

**When to use:** After compressing images and before calling `submitReport`.

**Example:**
```typescript
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

async function uploadMediaFiles(
  files: File[],
  reportId: string,
  onProgress?: (fileIndex: number, percent: number) => void
): Promise<string[]> {
  const storage = getStorage()
  const urls: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const filename = `${Date.now()}-${i}.jpg`
    const storageRef = ref(storage, `reports/${reportId}/media/${filename}`)

    const snapshot = await uploadBytes(storageRef, file)
    const url = await getDownloadURL(snapshot.ref)
    urls.push(url)
    onProgress?.(i, 100)
  }

  return urls
}
```

**Source:** Firebase Storage Web SDK docs — `ref()`, `uploadBytes()`, `getDownloadURL()`

---

### Pattern 6: LocationPickerMap with Draggable Marker

**What:** Standalone Leaflet map with draggable marker; position exposed via `onLocationChange` callback.

**When to use:** Step 3 of the report form (D-80).

**Example:**
```typescript
// LocationPickerMap.tsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon issue in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface Props {
  initialLat?: number
  initialLng?: number
  onLocationChange: (lat: number, lng: number) => void
}

function DraggableMarker({ lat, lng, onDragEnd }: {
  lat: number; lng: number
  onDragEnd: (lat: number, lng: number) => void
}) {
  const markerRef = useRef<L.Marker>(null)

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current
      if (marker) {
        const pos = marker.getLatLng()
        onDragEnd(pos.lat, pos.lng)
      }
    },
  }

  useMapEvents({})

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[lat, lng]}
      ref={markerRef}
    />
  )
}

export function LocationPickerMap({ initialLat = 14.15, initialLng = 122.9, onLocationChange }: Props) {
  const [position, setPosition] = useState({ lat: initialLat, lng: initialLng })

  function handleDragEnd(lat: number, lng: number) {
    setPosition({ lat, lng })
    onLocationChange(lat, lng)
  }

  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={12}
      style={{ height: 300, width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <DraggableMarker
        lat={position.lat}
        lng={position.lng}
        onDragEnd={handleDragEnd}
      />
    </MapContainer>
  )
}
```

**Note:** Must handle React 18 Strict Mode double-invocation. Guard MapContainer mounting with a `mounted` state flag (see existing `TestMap.tsx` pattern).

**Source:** react-leaflet v4 docs — `useMapEvents`, `Marker` with `draggable`; Leaflet 1.9 docs — `marker.on('dragend', ...)`

---

### Pattern 7: Geolocation API with Error Handling

**What:** GPS auto-detect with graceful fallback to manual pin placement.

**When to use:** Step 3, when user clicks "Use My Location" button.

**Example:**
```typescript
interface GeolocationResult {
  coords: { lat: number; lng: number }
  error?: string
}

async function detectLocation(): Promise<GeolocationResult> {
  if (!navigator.geolocation) {
    return { coords: { lat: 0, lng: 0 }, error: 'Geolocation not supported' }
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude

        // Validate within Camarines Norte bounds
        if (lat < 13.8 || lat > 14.8 || lng < 122.3 || lng > 123.3) {
          resolve({
            coords: { lat, lng },
            error: 'Location outside Camarines Norte — please place pin manually',
          })
        } else {
          resolve({ coords: { lat, lng } })
        }
      },
      (err) => {
        let message = 'Location unavailable'
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Location permission denied — please place pin manually'
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Location unavailable — please place pin manually'
        }
        resolve({ coords: { lat: 0, lng: 0 }, error: message })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}
```

**Source:** Geolocation API standard — `getCurrentPosition(success, error, options)`

---

### Pattern 8: Cloud Function submitReport (firestore.runTransaction)

**What:** Atomically create three report documents.

**When to use:** When the client calls the `submitReport` callable.

**Example (functions/src/reports/submitReport.ts):**
```typescript
import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { CallableOptions } from 'firebase-functions/v2/https'
import { validateAuthenticated, checkRateLimit } from '../security'
import { sanitizeReportInput } from '../security/sanitize'
import { IncidentType, Severity, WorkflowState, ReportStatus } from '@kitty/pkg/types' // or shared types

export const submitReportOptions: CallableOptions = {
  secrets: [],
  region: 'asia-east1',
}

interface SubmitReportData {
  type: string
  severity: string
  description: string
  municipalityCode: string
  barangayCode: string
  exactLocation: { lat: number; lng: number }
  mediaUrls: string[]
}

export const submitReport = onCall<SubmitReportData>(
  submitReportOptions,
  async (request) => {
    const { auth } = request
    validateAuthenticated(auth) // throws if not authenticated

    const userId = auth.uid
    const { type, severity, description, municipalityCode, barangayCode, exactLocation, mediaUrls } = request.data

    // Sanitize input
    const cleanData = sanitizeReportInput({ type, severity, description, municipalityCode, barangayCode, exactLocation, mediaUrls })

    // Rate limit check
    const rateLimitResult = await checkRateLimit(userId)
    if (!rateLimitResult.allowed) {
      throw new HttpsError('resource-exhausted', 'Report rate limit exceeded', {
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt.toISOString(),
      })
    }

    const db = getFirestore()
    const reportId = db.collection('reports').doc().id // generate ID upfront

    // Compute geohash for public location
    const geohash = encodeGeohash(exactLocation.lat, exactLocation.lng) // via ngeohash

    const now = admin.firestore.FieldValue.serverTimestamp()

    // Atomic transaction: create all three docs
    await db.runTransaction(async (tx) => {
      const reportsRef = db.collection('reports').doc(reportId)
      const reportPrivateRef = db.collection('report_private').doc(reportId)
      const reportOpsRef = db.collection('report_ops').doc(reportId)

      tx.set(reportsRef, {
        id: reportId,
        type: cleanData.type,
        severity: cleanData.severity,
        description: cleanData.description,
        location: {
          lat: exactLocation.lat,
          lng: exactLocation.lng,
          geohash,
        },
        municipalityCode: cleanData.municipalityCode,
        barangayCode: cleanData.barangayCode,
        mediaUrls: cleanData.mediaUrls,
        createdAt: now,
        updatedAt: now,
        reporterId: userId,
        workflowState: WorkflowState.Pending,
      })

      tx.set(reportPrivateRef, {
        id: reportId,
        exactLocation,
        reporterEmail: auth.token.email || '',
        reporterName: auth.token.name || '',
        ownerStatus: ReportStatus.Submitted,
        activityLog: [{
          action: 'created',
          performedBy: userId,
          performedAt: new Date().toISOString(),
          details: 'Report submitted',
        }],
      })

      tx.set(reportOpsRef, {
        id: reportId,
      })
    })

    // Increment rate limit counter
    await incrementRateLimit(userId)

    return { reportId }
  }
)
```

**Source:** Firebase Functions v2 — `onCall`, `CallableOptions`; Firestore Admin — `db.runTransaction()`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | React Hook Form + Zod resolver | RHF tracks dirty/touched state, only re-validates changed fields, minimal re-renders |
| Image compression | Canvas resize manually | `browser-image-compression` | Handles EXIF rotation, Web Workers, browser quirks |
| IndexedDB access | Raw IndexedDB API | `idb` library | Promise-based, handles schema migrations, cleaner API |
| Geohash encoding | Custom base32 encoding | `ngeohash` | Battle-tested, correct base32 alphabet for geolocation |
| Storage upload | XMLHttpRequest progress | Firebase SDK `uploadBytes` + `getDownloadURL` | Handles retries, security rules integration |
| Geolocation fallback | Assume GPS always works | Explicit error handling with user message | GPS can be denied, unavailable, or return out-of-bounds coords |

---

## Common Pitfalls

### Pitfall 1: React 18 Strict Mode Double-Invocation of Effects
**What goes wrong:** `useEffect` in LocationPickerMap fires twice in dev, causing Leaflet to initialize twice and creating duplicate marker events.
**How to avoid:** Wrap MapContainer in a `mounted` state guard (existing pattern from `TestMap.tsx`):
```typescript
const [mounted, setMounted] = useState(false)
useEffect(() => { setMounted(true) }, [])
if (!mounted) return null
```

### Pitfall 2: Per-Step Validation Triggers on Every Keystroke
**What goes wrong:** `mode: 'onSubmit'` on useForm only validates on submit, not on step advance. But `mode: 'onBlur'` with `trigger()` can cause validation to fire while user is still typing in a later step.
**How to avoid:** Use `mode: 'onBlur'` and only call `trigger(stepFields)` explicitly on "Next" button click. Do NOT call `trigger()` inside `useEffect` watching form values.

### Pitfall 3: Image Compression Blocks UI Thread
**What goes wrong:** Without `useWebWorker: true`, image compression runs on main thread and freezes the UI for large images.
**How to avoid:** Always use `useWebWorker: true` (default). Show progress via `onProgress` callback so user sees activity.

### Pitfall 4: Geohash Precision Too Low for Public Document
**What goes wrong:** Geohash < 9 chars leaks too much location precision to public. `ngeohash.encode()` defaults to ~9 chars (precision ~2m) when not specified.
**How to avoid:** Explicitly pass `precision: 9` to `encode()`.

### Pitfall 5: Firebase Storage Upload Without Security Rules Path
**What goes wrong:** Uploading to the wrong path gets rejected by security rules. The storage rules specify `match /reports/{reportId}/media/{filename}` — uploads must match this exact path pattern.
**How to avoid:** Always construct path as `reports/${reportId}/media/${filename}` — Cloud Function creates the report first, then client uploads media to that reportId.

### Pitfall 6: Draft Overwrites After Successful Submit
**What goes wrong:** If draft is cleared after submit but submit fails, user loses data.
**How to avoid:** Clear draft ONLY after `submitReport` returns successfully. On error, keep draft intact.

### Pitfall 7: Stale User Location from Custom Claims
**What goes wrong:** `useAuth().customClaims?.municipalityCode` may be null for citizens (D-48: citizens have municipalityCode=null initially).
**How to avoid:** Use claims for fallback center ONLY if non-null. Default to province center (14.15, 122.9) for citizens.

---

## Code Examples

### Submitting the Report (client-side)

```typescript
// features/report/submitReport.ts
import { httpsCallable } from 'firebase/functions'
import { getFunctions } from 'firebase/storage'

export async function submitReport(data: {
  type: IncidentType
  severity: Severity
  description: string
  municipalityCode: string
  barangayCode: string
  exactLocation: { lat: number; lng: number }
  mediaUrls: string[]
}): Promise<{ reportId: string }> {
  const fn = getFunctions()
  const submitReportFn = httpsCallable<typeof data, { reportId: string }>(fn, 'submitReport')
  const result = await submitReportFn(data)
  return result.data
}
```

### GPS Button with Auto-Fill

```typescript
// In StepLocationMedia.tsx
const [gpsLoading, setGpsLoading] = useState(false)
const [gpsError, setGpsError] = useState<string | null>(null)

async function handleUseMyLocation() {
  setGpsLoading(true)
  setGpsError(null)

  const result = await detectLocation()

  if (result.error) {
    setGpsError(result.error)
  } else {
    form.setValue('location.lat', result.coords.lat)
    form.setValue('location.lng', result.coords.lng)
    form.setValue('location.geohash', encodeGeohash(result.coords.lat, result.coords.lng))
    // Also update municipality/barangay selectors
    const municipality = reverseGeocodeMunicipality(result.coords.lat, result.coords.lng)
    if (municipality) form.setValue('municipalityCode', municipality.code)
  }

  setGpsLoading(false)
}
```

### Step Review — Display Summary Before Submit

```typescript
function StepReview({ form, onSubmit }: { form: UseFormReturn; onSubmit: () => void }) {
  const { watch } = form
  const formData = watch()

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-gray-500">Incident Type</label>
        <div className="font-medium">{formData.type}</div>
      </div>
      <div>
        <label className="text-sm text-gray-500">Severity</label>
        <div className="font-medium">{formData.severity}</div>
      </div>
      <div>
        <label className="text-sm text-gray-500">Description</label>
        <div>{formData.description}</div>
      </div>
      <div>
        <label className="text-sm text-gray-500">Location</label>
        <div>{formData.municipalityCode} / {formData.barangayCode}</div>
      </div>
      {formData.mediaUrls?.length > 0 && (
        <div>
          <label className="text-sm text-gray-500">Photos ({formData.mediaUrls.length}/5)</label>
          <div className="grid grid-cols-3 gap-2">
            {formData.mediaUrls.map((url, i) => (
              <img key={i} src={url} className="w-full h-20 object-cover rounded" />
            ))}
          </div>
        </div>
      )}
      <button onClick={onSubmit} className="btn-primary w-full">Submit Report</button>
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Form state in useState per field | React Hook Form with unified form state | Phase 5 | Eliminates prop-drilling; RHF handles validation, errors, dirty state |
| Canvas-based image resize | browser-image-compression library | Phase 5 | Handles EXIF orientation, Web Workers, browser quirks |
| Raw IndexedDB API | idb wrapper | Phase 5 | Promise-based, no callback hell |
| Server-side geohash | ngeohash client-side | Phase 5 | No round-trip needed for public document |

---

## Open Questions

1. **Barangay catalog population**
   - What's unclear: Is `municipalities/{code}/barangays` Firestore collection already seeded? Need to verify seed script exists.
   - Recommendation: Check if `scripts/seed-catalog.ts` or similar exists. If not, this is a prerequisite for D-92 (barangay dropdown).

2. **Reverse geocoding for municipality/barangay from GPS coords**
   - What's unclear: D-93 mentions "reverse geocode to fill municipality/barangay selectors" but no specific API is chosen.
   - Options: (a) OSM Nominatim free tier (rate limited), (b) client-side point-in-polygon using static GeoJSON, (c) Firestore lookup if coords stored in barangay docs.
   - Recommendation: Use static GeoJSON point-in-polygon (municipality boundaries already loaded from `/public/data/municipalities.geojson`) — no external API dependency.

3. **reportId generation strategy**
   - What's unclear: Who generates the reportId — client or Cloud Function?
   - Recommendation: Cloud Function generates ID via `db.collection('reports').doc().id` and returns it to client for subsequent media uploads. Client cannot know ID before CF creates the record (since storage rules require reportId to exist).

4. **Storage upload timing (before or after CF call)**
   - What's unclear: D-88 says "CF provides signed URL or upload token" — but the storage rules don't require a signed URL (they allow direct upload if authenticated).
   - Recommendation: Client uploads directly to `reports/{reportId}/media/{filename}` using Firebase Storage SDK, then passes `mediaUrls[]` to `submitReport` callable. This avoids the extra round-trip for signed URLs.

5. **Wave 0 test infrastructure gaps**
   - What's unclear: No vitest.config.ts exists at project root. Need to verify how `npm run test` works without a config file (Vitest auto-detection).
   - Recommendation: Create `vitest.config.ts` to explicitly configure test environment (jsdom vs. node), globals, and coverage.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Cloud Functions | ✓ | 20+ (per package.json engines) | — |
| Firebase CLI | Emulators, CF deploy | ✓ | (detected in project) | — |
| Firebase Emulators | Integration tests | ✓ | (configured per package.json scripts) | — |
| Vitest | Unit/component tests | ✓ | 4.1.2 (per package.json) | — |
| Playwright | E2E tests | ✓ | 1.59.1 (per package.json) | — |
| `npm install` (new packages) | react-hook-form, idb, ngeohash | ✓ | npm available | — |

**Missing dependencies with fallback:**
- None — all required tools are available in the project environment.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 (unit/integration) + Playwright 1.59.1 (E2E) |
| Config file | None detected — Vitest auto-detects. **Create `vitest.config.ts` in Wave 0.** |
| Quick run command | `npm test -- --run src/features/report` |
| Full suite command | `npm test -- --run` |
| E2E command | `npx playwright test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| RPT-01 | Multi-step form: all fields present, step navigation works | Unit + E2E | `vitest StepTypeSeverity` / `playwright report-submission.spec.ts` | Wave 0 needed |
| RPT-02 | Location picker: map renders, draggable marker, GPS button | Unit | `vitest LocationPickerMap` | Wave 0 needed |
| RPT-03 | Municipality/barangay selectors populate and filter | Unit | `vitest StepLocationMedia` | Wave 0 needed |
| RPT-04 | Coordinates outside bounds (lat <13.8, >14.8, lng <122.3, >123.3) rejected | Unit | `vitest coordinate-validation` | Wave 0 needed |
| RPT-05 | Image compression: files >1MB compressed, output <=1MB, dimensions <=1920px | Unit | `vitest image-compression` | Wave 0 needed |
| RPT-06 | Cloud Function: three docs created atomically | Integration | Emulator test: `submitReport` CF | Wave 0 needed |
| RPT-07 | Public doc geohash 9-char, private doc exact coords | Unit + Integration | `vitest geohash-computation` + emulator verify | Wave 0 needed |
| RPT-08 | Unverified report not in `reports/` collection; only in `report_private/` | Integration | Emulator: query `reports/` as public user | Wave 0 needed |
| RPT-09 | Citizen sees own pending/rejected reports in Profile | E2E | `playwright my-reports.spec.ts` | Wave 0 needed |
| RPT-10 | `report_private` listener fires for own report immediately after submit | Integration | Emulator `onSnapshot` test | Wave 0 needed |
| RPT-11 | Owner status label "Submitted" shown immediately after submit | Unit | `vitest owner-status-label` | Wave 0 needed |

### Wave 0 Gaps

- [ ] `vitest.config.ts` — create with jsdom environment, `@testing-library/jest-dom` setup, globals
- [ ] `tests/unit/report-form.test.ts` — tests for ReportFormSchema, coordinate validation, geohash encoding
- [ ] `tests/unit/image-compression.test.ts` — tests for compression output size/dimensions
- [ ] `tests/unit/owner-status.test.ts` — tests for WORKFLOW_TO_OWNER_STATUS mapping
- [ ] `tests/integration/submit-report.test.ts` — CF emulator test for three-doc creation
- [ ] `tests/e2e/report-submission.spec.ts` — Playwright full form flow
- [ ] `tests/e2e/my-reports.spec.ts` — Playwright citizen report tracking flow

---

## Sources

### Primary (HIGH confidence)
- react-hook-form v7 — official docs (`https://react-hook-form.com/get-started`) — `useForm`, `zodResolver`, `trigger`, `handleSubmit` API
- browser-image-compression — GitHub (`https://github.com/Donaldcwl/browser-image-compression`) — `imageCompression(file, options)` API, Options table
- idb — GitHub (`https://github.com/jakearchibald/idb`) — `openDB`, `db.put`, `db.get`, `db.delete` pattern
- ngeohash — CDN README (`https://cdn.jsdelivr.net/npm/ngeohash@0.6.3/README.md`) — `encode(lat, lng, precision)`, `decode(hash)`
- Firebase Storage — Firebase documentation (`https://firebase.google.com/docs/storage/web/upload-files`) — `ref()`, `uploadBytes()`, `getDownloadURL()`
- Leaflet Marker drag — Leaflet docs (`https://leafletjs.com/reference.html#marker`) — `dragend` event
- Geolocation API — W3C standard — `getCurrentPosition(success, error, options)`

### Secondary (MEDIUM confidence)
- Firebase Functions v2 callable — `onCall`, `CallableOptions` — verified via `functions/src/index.ts` pattern
- Firestore transaction — `db.runTransaction()` — verified via `rateLimit.ts` usage in codebase
- React 18 Strict Mode double-invoke — common React 18 issue with MapContainer

### Tertiary (LOW confidence)
- react-hook-form multi-step wizard pattern — widely documented community pattern (not in official docs)
- Per-step validation with `trigger()` — community pattern, needs verification with Zod v4

---

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — all libraries verified via npm registry and docs; Zod v4 + @hookform/resolvers v5 compatibility confirmed via versions
- Architecture: MEDIUM-HIGH — patterns well-established in React ecosystem; React 18 Strict Mode caveat is known
- Pitfalls: MEDIUM — identified from common React+Leaflet+Firebase issues
- Validation: LOW-MEDIUM — Vitest config gap identified; emulator-based integration tests need verification

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (30 days for stable domain)
