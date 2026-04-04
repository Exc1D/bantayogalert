import { useMemo, useState, useRef } from 'react'
import Supercluster from 'supercluster'
import type { Feature, Point, BBox } from 'geojson'

interface UseSuperclusterOptions {
  features: Feature<Point>[]
  bounds: BBox | null
  zoom: number
}

interface UseSuperclusterResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clusters: ReturnType<Supercluster<any, any>['getClusters']>
  supercluster: Supercluster | null
}

export function useSupercluster({ features, bounds, zoom }: UseSuperclusterOptions): UseSuperclusterResult {
  const [version, setVersion] = useState(0)
  const indexRef = useRef<Supercluster | null>(null)

  const index = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idx = new Supercluster<any, any>({
      radius: 60,
      maxZoom: 16,
    })
    if (features.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (idx as any).load(features)
      setVersion((v) => v + 1)
    }
    indexRef.current = idx
    return idx
  }, [features])

  const clusters = useMemo(() => {
    if (!bounds) return []
    return index.getClusters(bounds, Math.floor(zoom))
  }, [index, bounds, zoom, version])

  return { clusters, supercluster: indexRef.current }
}
