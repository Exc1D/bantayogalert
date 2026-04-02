import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { getFirebaseFirestore } from '../../config/firebase'
import 'leaflet/dist/leaflet.css'

const CENTER: [number, number] = [14.1, 122.9]
const DEFAULT_ZOOM = 10

interface Report {
  id: string
  type: string
  description: string
  severity: string
  status: string
  municipality: string
  lat?: number
  lng?: number
  createdAt: { toDate: () => Date }
}

const TYPE_ICONS: Record<string, string> = {
  flood: '🌊',
  landslide: '⛰️',
  fire: '🔥',
  earthquake: '🌍',
  storm: '🌪️',
  accident: '🚗',
  crime: '🚨',
  medical: '🏥',
  utility: '⚡',
  other: '📌',
}

const TYPE_COLORS: Record<string, string> = {
  flood: '#3b82f6',
  landslide: '#f97316',
  fire: '#ef4444',
  earthquake: '#eab308',
  storm: '#a855f7',
  accident: '#6b7280',
  crime: '#ec4899',
  medical: '#ef4444',
  utility: '#eab308',
  other: '#6b7280',
}

function createCustomIcon(type: string): L.DivIcon {
  const emoji = TYPE_ICONS[type?.toLowerCase()] ?? '📌'
  const color = TYPE_COLORS[type?.toLowerCase()] ?? '#6b7280'
  return L.divIcon({
    html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;">${emoji}</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

interface MapControllerProps {
  center: [number, number]
  zoom: number
  onMapReady?: (map: L.Map) => void
}

function MapController({ center, zoom, onMapReady }: MapControllerProps) {
  const map = useMap()
  useEffect(() => {
    if (onMapReady) onMapReady(map)
  }, [])
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])
  return null
}

interface BottomSheetProps {
  report: Report | null
  onClose: () => void
  onViewDetails: () => void
}

function BottomSheet({ report, onClose, onViewDetails }: BottomSheetProps) {
  if (!report) return null

  const icon = TYPE_ICONS[report.type?.toLowerCase()] ?? '📌'
  const createdAtDate = report.createdAt?.toDate?.() ?? new Date()

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[1000] max-h-[50vh] overflow-auto">
      <div className="p-4">
        {/* Handle */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        
        <div className="flex items-start gap-3">
          <span className="text-3xl">{icon}</span>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 capitalize">
              {report.type?.replace('_', ' ') ?? 'Report'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {report.description || 'No description'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {report.municipality?.replace('_', ' ')} • {createdAtDate.toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={onViewDetails}
            className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}

interface FilterChipsProps {
  selectedType: string | null
  selectedSeverity: string | null
  onTypeChange: (type: string | null) => void
  onSeverityChange: (severity: string | null) => void
}

function FilterChips({ selectedType, selectedSeverity, onTypeChange, onSeverityChange }: FilterChipsProps) {
  const types = ['flood', 'landslide', 'fire', 'storm', 'accident', 'other']
  const severities = ['low', 'medium', 'high', 'critical']

  return (
    <div className="absolute top-2 left-2 right-2 z-[500] flex flex-wrap gap-1">
      <select
        value={selectedType ?? ''}
        onChange={(e) => onTypeChange(e.target.value || null)}
        className="bg-white px-3 py-1.5 rounded-full text-sm border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Types</option>
        {types.map((t) => (
          <option key={t} value={t}>
            {TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
      <select
        value={selectedSeverity ?? ''}
        onChange={(e) => onSeverityChange(e.target.value || null)}
        className="bg-white px-3 py-1.5 rounded-full text-sm border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Severity</option>
        {severities.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
    </div>
  )
}

interface MobileMapTabProps {
  onNewReport?: () => void
  onReportPress?: (reportId: string) => void
}

export function MobileMapTab({ onNewReport, onReportPress }: MobileMapTabProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    const fetchReports = async () => {
      const db = getFirebaseFirestore()
      const reportsRef = collection(db, 'reports')
      let q = query(reportsRef)
      
      const constraints: any[] = []
      if (selectedType) constraints.push(where('type', '==', selectedType))
      if (selectedSeverity) constraints.push(where('severity', '==', selectedSeverity))
      
      const snap = await getDocs(q)
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Report))
        .filter((r) => r.lat != null && r.lng != null)
      
      setReports(data)
    }
    fetchReports()
  }, [selectedType, selectedSeverity])

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          setUserLocation(loc)
          mapRef.current?.setView(loc, 14)
        },
        (err) => console.error('Geolocation error:', err)
      )
    }
  }

  const handleMarkerPress = (report: Report) => {
    setSelectedReport(report)
  }

  const filteredReports = reports.filter((r) => {
    if (selectedType && r.type !== selectedType) return false
    if (selectedSeverity && r.severity !== selectedSeverity) return false
    return true
  })

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        whenReady={() => {}}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={CENTER} zoom={DEFAULT_ZOOM} onMapReady={(m) => { mapRef.current = m }} />

        {filteredReports.map((report) => (
          <Marker
            key={report.id}
            position={[report.lat!, report.lng!]}
            icon={createCustomIcon(report.type)}
            eventHandlers={{
              click: () => handleMarkerPress(report),
            }}
          />
        ))}

        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              html: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>',
              className: '',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          />
        )}
      </MapContainer>

      {/* Filter chips */}
      <FilterChips
        selectedType={selectedType}
        selectedSeverity={selectedSeverity}
        onTypeChange={setSelectedType}
        onSeverityChange={setSelectedSeverity}
      />

      {/* Current location button */}
      <button
        onClick={handleLocateMe}
        className="absolute bottom-24 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-gray-50 active:scale-95 transition-all z-[500]"
        aria-label="My Location"
      >
        📍
      </button>

      {/* FAB */}
      {onNewReport && (
        <button
          onClick={onNewReport}
          className="absolute bottom-20 right-4 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-primary-600 active:scale-95 transition-all z-[500]"
          aria-label="New Report"
        >
          +
        </button>
      )}

      {/* Bottom sheet */}
      {selectedReport && (
        <BottomSheet
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onViewDetails={() => {
            onReportPress?.(selectedReport.id)
            setSelectedReport(null)
          }}
        />
      )}
    </div>
  )
}
