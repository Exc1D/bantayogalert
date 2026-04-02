import { useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MUNICIPALITIES, REPORT_TYPES, SEVERITY_COLORS } from '../../utils/constants'
import { createReport } from '../../services/reportService'
import { useAuth } from '../../contexts/AuthContext'
import { uploadMedia } from '../../utils/upload'
import type { CreateReportInput, MunicipalityCode, ReportType, ReportCategory, SeverityLevel } from '../../utils/validators'

// Fix leaflet marker icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const markerIcon = new L.Icon({
  iconUrl: iconUrl as any,
  iconRetinaUrl: iconRetinaUrl as any,
  shadowUrl: shadowUrl as any,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface Position {
  lat: number
  lng: number
}

function LocationPicker({ position, onChange }: { position: Position | null; onChange: (pos: Position) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })

  return position ? <Marker position={position} icon={markerIcon} /> : null
}

interface ReportFormProps {
  onSuccess?: (reportId: string) => void
  onCancel?: () => void
}

const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: 'water_level', label: 'Water Level' },
  { value: 'fire_size', label: 'Fire Size' },
  { value: 'injuries_reported', label: 'Injuries Reported' },
  { value: 'structural_damage', label: 'Structural Damage' },
  { value: 'traffic_accident', label: 'Traffic Accident' },
  { value: 'landslide_suspected', label: 'Landslide Suspected' },
  { value: 'gas_leak', label: 'Gas Leak' },
  { value: 'power_outage', label: 'Power Outage' },
  { value: 'other', label: 'Other' },
]

const SEVERITIES: { value: SeverityLevel; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: SEVERITY_COLORS.low },
  { value: 'medium', label: 'Medium', color: SEVERITY_COLORS.medium },
  { value: 'high', label: 'High', color: SEVERITY_COLORS.high },
  { value: 'critical', label: 'Critical', color: SEVERITY_COLORS.critical },
]

const DEFAULT_POSITION: Position = { lat: 14.1057, lng: 122.9525 } // Camarines Norte center

export function ReportForm({ onSuccess, onCancel }: ReportFormProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form state
  const [type, setType] = useState<ReportType | null>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const [municipality, setMunicipality] = useState<MunicipalityCode | null>(null)
  const [barangay, setBarangay] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState<ReportCategory | null>(null)
  const [severity, setSeverity] = useState<SeverityLevel>('medium')
  const [description, setDescription] = useState('')
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [anonymous, setAnonymous] = useState(false)

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (mediaFiles.length + files.length > 3) {
      setError('Maximum 3 images allowed')
      return
    }
    const validFiles = files.filter(f => f.type.startsWith('image/'))
    setMediaFiles(prev => [...prev, ...validFiles])
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setMediaPreviews(prev => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }, [mediaFiles.length])

  const removeMedia = useCallback((index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
    setMediaPreviews(prev => prev.filter((_, i) => i !== index))
  }, [])

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 1 && !type) {
      newErrors.type = 'Please select a report type'
    }
    if (currentStep === 2) {
      if (!position) newErrors.position = 'Please tap the map to select location'
      if (!municipality) newErrors.municipality = 'Please select municipality'
      if (!barangay.trim()) newErrors.barangay = 'Barangay is required'
    }
    if (currentStep === 3) {
      if (!category) newErrors.category = 'Please select a category'
      if (description.trim().length < 10) {
        newErrors.description = 'Description must be at least 10 characters'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    setStep(prev => prev - 1)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return
    if (!type || !position || !municipality || !category) return

    setSubmitting(true)
    setError(null)

    try {
      const input: CreateReportInput = {
        type,
        category,
        severity,
        description: description.trim(),
        location: {
          lat: position.lat,
          lng: position.lng,
          barangay: barangay.trim(),
          municipality,
          address: address.trim() || undefined,
        },
        submitterAnonymous: anonymous,
      }

      // Create report first to get ID
      const reportId = await createReport(input, user!.uid, user!.displayName ?? 'Anonymous')

      // Upload media if any
      if (mediaFiles.length > 0 && user) {
        const mediaUrls: string[] = []
        for (let i = 0; i < mediaFiles.length; i++) {
          setUploadProgress(((i + 1) / mediaFiles.length) * 100)
          const file = mediaFiles[i]
          if (!file) continue
          const url = await uploadMedia(file, user.uid, reportId)
          mediaUrls.push(url)
        }
        // Update report with media URLs (Phase 4 - media field update)
        void mediaUrls
      }

      onSuccess?.(reportId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ←
            </button>
          )}
          <span className="text-sm text-gray-500">Step {step} of 4</span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="flex gap-1 p-4 pb-0">
        {[1, 2, 3, 4].map(s => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${
              s <= step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Type Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">What type of incident?</h2>
            <p className="text-gray-500 text-sm">Select the type that best describes the emergency</p>
            <div className="grid grid-cols-2 gap-3">
              {REPORT_TYPES.map(rt => (
                <button
                  key={rt.value}
                  onClick={() => setType(rt.value as ReportType)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    type === rt.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl">{rt.icon}</span>
                  <div className="mt-2 font-medium">{rt.label}</div>
                </button>
              ))}
            </div>
            {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Where is the incident?</h2>
            <p className="text-gray-500 text-sm">Tap the map to drop a pin at the exact location</p>

            <div className="h-64 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <MapContainer
                center={DEFAULT_POSITION}
                zoom={11}
                className="h-full w-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© OpenStreetMap'
                />
                <LocationPicker position={position} onChange={setPosition} />
              </MapContainer>
            </div>
            {errors.position && <p className="text-red-500 text-sm">{errors.position}</p>}

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Municipality *</label>
                <select
                  value={municipality ?? ''}
                  onChange={e => setMunicipality(e.target.value as MunicipalityCode)}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <option value="">Select municipality</option>
                  {MUNICIPALITIES.map(m => (
                    <option key={m.code} value={m.code}>{m.name}</option>
                  ))}
                </select>
                {errors.municipality && <p className="text-red-500 text-sm">{errors.municipality}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Barangay *</label>
                <input
                  type="text"
                  value={barangay}
                  onChange={e => setBarangay(e.target.value)}
                  placeholder="e.g., Mangcamagong"
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
                {errors.barangay && <p className="text-red-500 text-sm">{errors.barangay}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address (optional)</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street address or landmark"
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Incident Details</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                value={category ?? ''}
                onChange={e => setCategory(e.target.value as ReportCategory)}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Severity *</label>
              <div className="flex gap-2">
                {SEVERITIES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSeverity(s.value)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      severity === s.value
                        ? 'border-current'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    style={{ color: severity === s.value ? s.color : undefined }}
                  >
                    <div
                      className="w-4 h-4 rounded-full mx-auto mb-1"
                      style={{ backgroundColor: s.color }}
                    />
                    <div className="text-xs font-medium">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what happened, including any important details..."
                rows={4}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{errors.description && <span className="text-red-500">{errors.description}</span>}</span>
                <span>{description.length}/1000</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={anonymous}
                onChange={e => setAnonymous(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="anonymous" className="text-sm">Submit anonymously</label>
            </div>
          </div>
        )}

        {/* Step 4: Media */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Add Photos (Optional)</h2>
            <p className="text-gray-500 text-sm">Upload up to 3 photos of the incident</p>

            <div className="grid grid-cols-3 gap-2">
              {mediaPreviews.map((preview, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={preview} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeMedia(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {mediaFiles.length < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400"
                >
                  <span className="text-2xl">+</span>
                  <span className="text-xs">Add Photo</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2">
              <h3 className="font-medium">Summary</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span>{REPORT_TYPES.find(r => r.value === type)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location:</span>
                  <span>{barangay}, {MUNICIPALITIES.find(m => m.code === municipality)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Severity:</span>
                  <span className="font-medium capitalize" style={{ color: SEVERITY_COLORS[severity] }}>
                    {severity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t dark:border-gray-700">
        {step < 4 ? (
          <button
            onClick={nextStep}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        )}
      </div>
    </div>
  )
}
