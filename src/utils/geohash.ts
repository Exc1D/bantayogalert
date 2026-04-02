import ngeohash from 'ngeohash'

/**
 * Encode a lat/lng to a geohash string.
 * 8 chars ≈ 19m precision — stored on every report doc.
 * 6 chars ≈ 1.2km × 0.6km — used for viewport bounding box queries.
 */
export function encodeGeohash(lat: number, lng: number, precision = 8): string {
  return ngeohash.encode(lat, lng, precision)
}

/**
 * Get a geohash prefix range covering a bounding box.
 * Returns the 6-char prefix range for use in Firestore:
 *   where('geohash', '>=', range.lo).where('geohash', '<=', range.hi)
 *
 * Algorithm: encode all 4 corners at precision 6, find the longest common
 * prefix — that prefix covers the entire bounding box.
 */
export function getGeohashRange(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number,
  precision = 6
): { lo: string; hi: string } {
  const corners = [
    ngeohash.encode(minLat, minLng, precision),
    ngeohash.encode(minLat, maxLng, precision),
    ngeohash.encode(maxLat, minLng, precision),
    ngeohash.encode(maxLat, maxLng, precision),
  ]

  // Find common prefix length across all 4 corners
  let prefixLen = 0
  for (let i = 0; i < precision; i++) {
    const char = corners[0]![i]!
    if (corners.every((c) => c[i] === char)) {
      prefixLen = i + 1
    } else {
      break
    }
  }

  const prefix = corners[0]!.substring(0, prefixLen)
  const lo = prefix.padEnd(precision, '0')
  const hi = prefix.padEnd(precision, 'z')

  return { lo, hi }
}

/**
 * Decode a geohash back to lat/lng center point.
 */
export function decodeGeohash(hash: string): { lat: number; lng: number } {
  const { latitude, longitude } = ngeohash.decode(hash)
  return { lat: latitude, lng: longitude }
}
