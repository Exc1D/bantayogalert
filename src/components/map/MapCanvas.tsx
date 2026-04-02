import { useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useMap } from '../../contexts/MapContext'
import { useReports } from '../../contexts/ReportsContext'
import { useModal } from '../../contexts/ModalContext'
import type { Report, ReportType, SeverityLevel, Severity } from '../../contexts/ReportsContext'

import 'leaflet/dist/leaflet.css'

// Fix default marker icon
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

const REPORT_TYPE_ICONS: Record<ReportType, string> = {
  flood: '🌊',
  landslide: '⛰️',
  fire: '🔥',
  earthquake: '🌍',
  medical: '🏥',
  crime: '🚨',
  infrastructure: '🏗️',
  other: '📌',
}

function getSeverityColor(severity: Severity): string {
  return SEVERITY_COLORS[severity] ?? '#6b7280'
}

/** Tracks map movement and syncs viewport back to MapContext */
function MapEventHandler() {
  const { setViewport } = useMap()

  useMapEvents({
    moveend(e) {
      const map = e.target
      const center = map.getCenter()
      setViewport({
        lat: center.lat,
        lng: center.lng,
        zoom: map.getZoom(),
      })
    },
  })

  return null
}

/** "Center on my location" button handler */
function CenterMyLocationButton({ onCenter }: { onCenter: () => void }) {
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      () => {
        onCenter()
        setLocating(false)
      },
      (err) => {
        setError(err.message)
        setLocating(false)
      }
    )
  }

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <button
        onClick={handleClick}
        disabled={locating}
        className="bg-white shadow-md rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
        title="Center on my location"
      >
        {locating ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <span>📍</span>
        )}
        My Location
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

/** Map filter controls */
function MapFiltersControl() {
  const { filters, setFilters } = useMap()

  const reportTypes: ReportType[] = ['flood', 'landslide', 'fire', 'earthquake', 'medical', 'crime', 'infrastructure', 'other']
  const severities: Severity[] = ['critical', 'high', 'medium', 'low']

  const toggleType = (type: ReportType) => {
    const next = filters.selectedTypes.includes(type)
      ? filters.selectedTypes.filter((t) => t !== type)
      : [...filters.selectedTypes, type]
    setFilters({ ...filters, selectedTypes: next })
  }

  const toggleSeverity = (severity: Severity) => {
    const next = filters.selectedSeverities.includes(severity)
      ? filters.selectedSeverities.filter((s) => s !== severity)
      : [...filters.selectedSeverities, severity]
    setFilters({ ...filters, selectedSeverities: next })
  }

  const clearFilters = () => {
    setFilters({ selectedTypes: [], selectedSeverities: [] })
  }

  const hasFilters = filters.selectedTypes.length > 0 || filters.selectedSeverities.length > 0

  return (
    <div className="absolute top-4 left-4 z-[1000] bg-white shadow-md rounded-lg p-3 w-56">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-primary-500 hover:underline">
            Clear
          </button>
        )}
      </div>

      {/* Report Types */}
      <div className="mb-2">
        <p className="text-xs text-gray-500 mb-1 font-medium">Type</p>
        <div className="flex flex-wrap gap-1">
          {reportTypes.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`text-xs px-2 py-0.5 rounded border ${
                filters.selectedTypes.includes(type)
                  ? 'bg-primary-100 border-primary-400 text-primary-700'
                  : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
              title={type}
            >
              {REPORT_TYPE_ICONS[type]} {type}
            </button>
          ))}
        </div>
      </div>

      {/* Severities */}
      <div>
        <p className="text-xs text-gray-500 mb-1 font-medium">Severity</p>
        <div className="flex flex-wrap gap-1">
          {severities.map((severity) => (
            <button
              key={severity}
              onClick={() => toggleSeverity(severity)}
              className={`text-xs px-2 py-0.5 rounded border capitalize ${
                filters.selectedSeverities.includes(severity)
                  ? 'bg-primary-100 border-primary-400 text-primary-700'
                  : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
              style={{
                borderColor: filters.selectedSeverities.includes(severity) ? getSeverityColor(severity) : undefined,
                backgroundColor: filters.selectedSeverities.includes(severity)
                  ? `${getSeverityColor(severity)}20`
                  : undefined,
              }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: getSeverityColor(severity) }}
              />
              {severity}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface MapCanvasProps {
  className?: string
}

export function MapCanvas({ className = '' }: MapCanvasProps) {
  const { viewport, setViewport, setSelectedPinId, filters } = useMap()
  const { reports } = useReports()
  const { open } = useModal()
  const mapRef = useRef<L.Map | null>(null)

  const centerMyLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setViewport({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          zoom: 13,
        })
        if (mapRef.current) {
          mapRef.current.setView([position.coords.latitude, position.coords.longitude], 13)
        }
      },
      (err) => {
        console.error('Geolocation error:', err)
      }
    )
  }

  // Filter reports based on active filters
  const visibleReports = reports.filter((report) => {
    if (filters.selectedTypes.length > 0 && !filters.selectedTypes.includes(report.type as ReportType)) {
      return false
    }
    if (filters.selectedSeverities.length > 0 && !filters.selectedSeverities.includes(report.severity as SeverityLevel)) {
      return false
    }
    return true
  })

  const handleMarkerClick = (report: Report) => {
    setSelectedPinId(report.id)
    open('report-detail')
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <MapContainer
        center={[viewport.lat, viewport.lng]}
        zoom={viewport.zoom}
        className="w-full h-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventHandler />

        {visibleReports.map((report) => (
          <CircleMarker
            key={report.id}
            center={[report.location?.lat ?? 14.1, report.location?.lng ?? 122.9]}
            radius={8}
            pathOptions={{
              color: getSeverityColor(report.severity as SeverityLevel),
              fillColor: getSeverityColor(report.severity as SeverityLevel),
              fillOpacity: 0.7,
              weight: 2,
            }}
            eventHandlers={{
              click: () => handleMarkerClick(report),
            }}
          >
            {/* @ts-ignore - leaflet popup typing */}
            <div className="text-sm">
              <strong>{REPORT_TYPE_ICONS[report.type as ReportType]} {report.title}</strong>
              <br />
              <span className="capitalize">{report.severity}</span> — {report.municipality}
            </div>
          </CircleMarker>
        ))}
      </MapContainer>

      <CenterMyLocationButton onCenter={centerMyLocation} />
      <MapFiltersControl />
    </div>
  )
}
