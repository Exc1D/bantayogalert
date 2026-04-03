/**
 * useLocationDetector - GPS auto-detect with Camarines Norte bounds validation
 * D-82, D-83, D-84, D-93, D-94
 */
import { MUNICIPALITIES } from '@/lib/geo/municipality'
import type { Municipality } from '@/types/geo'

export interface GeolocationResult {
  coords: { lat: number; lng: number }
  error?: string
}

// Camarines Norte bounds
const CN_BOUNDS = {
  latMin: 13.8,
  latMax: 14.8,
  lngMin: 122.3,
  lngMax: 123.3,
}

function isInCamarinesNorte(lat: number, lng: number): boolean {
  return (
    lat >= CN_BOUNDS.latMin &&
    lat <= CN_BOUNDS.latMax &&
    lng >= CN_BOUNDS.lngMin &&
    lng <= CN_BOUNDS.lngMax
  )
}

export async function detectLocation(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        coords: { lat: 14.15, lng: 122.9 },
        error: 'Geolocation not supported by this browser',
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        const inBounds = isInCamarinesNorte(lat, lng)
        resolve({
          coords: { lat, lng },
          error: inBounds
            ? undefined
            : 'Location outside Camarines Norte. Please adjust the pin.',
        })
      },
      (err) => {
        let errorMsg = 'Location unavailable. Please place the pin manually.'
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied. Please place the pin manually.'
        }
        resolve({
          coords: { lat: 14.15, lng: 122.9 },
          error: errorMsg,
        })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}

/**
 * Find municipality by coordinates using point-in-polygon (Ray casting algorithm)
 * Falls back to nearest center if not found in GeoJSON
 */
export async function findMunicipalityByCoords(
  lat: number,
  lng: number
): Promise<Municipality | null> {
  try {
    const res = await fetch('/data/municipalities.geojson')
    if (!res.ok) throw new Error('Failed to load GeoJSON')
    const geojson = await res.json()

    // Ray casting algorithm for point-in-polygon
    function isPointInPolygon(
      point: [number, number],
      polygon: number[][]
    ): boolean {
      const [x, y] = point
      let inside = false
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i]![0]!
        const yi = polygon[i]![1]!
        const xj = polygon[j]![0]!
        const yj = polygon[j]![1]!
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside
        }
      }
      return inside
    }

    const features = geojson.features as GeoJSON.Feature[]
    for (const feature of features) {
      if (feature.geometry.type !== 'Polygon') continue
      const coords = feature.geometry.coordinates[0] as number[][]
      if (isPointInPolygon([lng, lat], coords)) {
        const code = feature.properties?.code as string
        const found = MUNICIPALITIES.find((m) => m.code === code)
        if (found) return found
      }
    }
  } catch {
    // GeoJSON load failed, fall through to nearest center
  }

  // Fallback: find nearest municipality center
  let nearest: Municipality | undefined
  let minDist = Infinity
  for (const m of MUNICIPALITIES) {
    const d = Math.sqrt(
      (m.center.lat - lat) ** 2 + (m.center.lng - lng) ** 2
    )
    if (d < minDist) {
      minDist = d
      nearest = m
    }
  }
  return nearest ?? null
}
