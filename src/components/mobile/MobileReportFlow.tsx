import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getFirebaseFirestore } from '../../config/firebase'
import { useAuth } from '../../contexts/AuthContext'
import 'leaflet/dist/leaflet.css'

const REPORT_TYPES = [
  { type: 'flood', icon: '🌊', label: 'Flood', color: 'bg-blue-100 border-blue-300' },
  { type: 'landslide', icon: '⛰️', label: 'Landslide', color: 'bg-orange-100 border-orange-300' },
  { type: 'fire', icon: '🔥', label: 'Fire', color: 'bg-red-100 border-red-300' },
  { type: 'earthquake', icon: '🌍', label: 'Earthquake', color: 'bg-yellow-100 border-yellow-300' },
  { type: 'storm', icon: '🌪️', label: 'Storm', color: 'bg-purple-100 border-purple-300' },
  { type: 'accident', icon: '🚗', label: 'Accident', color: 'bg-gray-100 border-gray-300' },
  { type: 'crime', icon: '🚨', label: 'Crime', color: 'bg-pink-100 border-pink-300' },
  { type: 'medical', icon: '🏥', label: 'Medical', color: 'bg-red-100 border-red-300' },
  { type: 'utility', icon: '⚡', label: 'Utility', color: 'bg-yellow-100 border-yellow-300' },
  { type: 'other', icon: '📌', label: 'Other', color: 'bg-gray-100 border-gray-300' },
]

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
]

const MUNICIPALITIES = [
  'basud', 'daet', 'josepanganiban', 'labo', 'mercedes',
  'paracale', 'sanlorenzo', 'sanvicente', 'talisay', 'vinzales',
  'capalonga', 'staelena'
]

const CENTER: [number, number] = [14.1, 122.9]

interface MapUpdaterProps {
  position: [number, number]
}

function MapUpdater({ position }: MapUpdaterProps) {
  const map = useMap()
  useEffect(() => {
    map.setView(position, 14)
  }, [map, position])
  return null
}

function createDraggableIcon() {
  return L.divIcon({
    html: '<div style="width:32px;height:32px;background:#0ea5e9;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

interface MobileReportFlowProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function MobileReportFlow({ onSuccess, onCancel }: MobileReportFlowProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [position, setPosition] = useState<[number, number]>(CENTER)
  const [municipality, setMunicipality] = useState(user?.municipality ?? '')
  const [barangay, setBarangay] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState('')
  const [severity, setSeverity] = useState<string>('medium')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUseMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude])
        },
        (err) => console.error('Geolocation error:', err)
      )
    }
  }

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).slice(0, 3 - photos.length).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const img = document.createElement('img')
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxSize = 1024
          let width = img.width
          let height = img.height
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height
              height = maxSize
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
          setPhotos((prev) => [...prev, dataUrl])
        }
        img.src = ev.target?.result as string
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleSubmit = async () => {
    if (!user || !selectedType) return
    setLoading(true)

    try {
      const db = getFirebaseFirestore()
      await addDoc(collection(db, 'reports'), {
        type: selectedType,
        category,
        severity,
        description: description.trim(),
        lat: position[0],
        lng: position[1],
        municipality,
        barangay,
        address: address.trim(),
        photos,
        status: 'pending',
        submitterUid: user.uid,
        submitterName: user.displayName,
        submitterEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
      }, 2000)
    } catch (err) {
      console.error('Error submitting report:', err)
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedType
      case 2:
        return !!municipality && !!barangay
      case 3:
        return !!description.trim()
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  if (success) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-white">
        <div className="text-6xl mb-4 animate-bounce">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Report Submitted!</h2>
        <p className="text-gray-500">Thank you for helping keep Camarines Norte safe.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Step indicator */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s === step ? 'bg-primary-500' : s < step ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-auto p-4">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">What type of incident?</h2>
            <p className="text-sm text-gray-500">Select the type that best describes the incident</p>
            <div className="grid grid-cols-2 gap-3">
              {REPORT_TYPES.map((item) => (
                <button
                  key={item.type}
                  onClick={() => setSelectedType(item.type)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedType === item.type
                      ? `${item.color} border-primary-500`
                      : `${item.color} border-transparent`
                  }`}
                >
                  <span className="text-3xl block mb-2">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                  {selectedType === item.type && (
                    <span className="block text-primary-500 mt-1">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Where is it located?</h2>
            <p className="text-sm text-gray-500">Drag the pin to set the exact location</p>
            
            {/* Mini map */}
            <div className="h-48 rounded-xl overflow-hidden border border-gray-200 relative">
              <MapContainer
                center={position}
                zoom={13}
                className="h-full w-full"
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapUpdater position={position} />
                <Marker
                  position={position}
                  draggable
                  icon={createDraggableIcon()}
                  eventHandlers={{
                    dragend: (e) => {
                      const latlng = e.target.getLatLng()
                      setPosition([latlng.lat, latlng.lng])
                    },
                  }}
                />
              </MapContainer>
            </div>

            <button
              onClick={handleUseMyLocation}
              className="w-full py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              📍 Use my location
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Municipality *</label>
              <select
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select municipality</option>
                {MUNICIPALITIES.map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
              <input
                type="text"
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
                placeholder="Enter barangay name"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House number, street, etc."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Incident Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Residential flood, Road obstruction"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <div className="grid grid-cols-4 gap-2">
                {SEVERITY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setSeverity(level.value)}
                    className={`py-2.5 rounded-lg border-2 transition-all text-center ${
                      severity === level.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${level.color}`} />
                    <span className="text-xs font-medium">{level.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                rows={5}
                placeholder="Describe what happened, including any relevant details..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">{description.length}/1000</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Add Photos</h2>
            <p className="text-sm text-gray-500">Upload up to 3 photos (optional)</p>

            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
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
              onChange={handlePhotoAdd}
              className="hidden"
            />

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h3 className="font-medium text-gray-900">Summary</h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-gray-500">Type:</span>{' '}
                  <span className="font-medium capitalize">{selectedType?.replace('_', ' ')}</span>
                </p>
                <p>
                  <span className="text-gray-500">Severity:</span>{' '}
                  <span className="font-medium capitalize">{severity}</span>
                </p>
                <p>
                  <span className="text-gray-500">Location:</span>{' '}
                  <span className="font-medium">
                    {barangay}, {municipality}
                  </span>
                </p>
                <p className="text-gray-500 truncate">{description.slice(0, 100)}...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleNext}
          disabled={!canProceed() || loading}
          className="w-full py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </span>
          ) : step < 4 ? (
            'Next'
          ) : (
            'Submit Report'
          )}
        </button>
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full py-2 mt-2 text-gray-500 hover:text-gray-700"
          >
            Back
          </button>
        )}
      </div>
    </div>
  )
}
