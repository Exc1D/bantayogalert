import { useMemo } from 'react'
import Supercluster from 'supercluster'
import type { Feature, Point, BBox } from 'geojson'

interface UseSuperclusterOptions {
  features: Feature<Point>[]
  bounds: BBox | null
  zoom: number
}

interface UseSuperclusterResult {
  clusters: ReturnType<Supercluster<any, any>['getClusters']>
  supercluster: Supercluster | null
}

export function useSupercluster({ features, bounds, zoom }: UseSuperclusterOptions): UseSuperclusterResult {
  const index = useMemo(() => {
    const idx = new Supercluster<any, any>({
      radius: 60,
      maxZoom: 16,
    })
    if (features.length > 0) {
      (idx as any).load(features)
    }
    return idx
  }, [features])

  const clusters = useMemo(() => {
    if (!bounds || features.length === 0) return []
    return index.getClusters(bounds, Math.floor(zoom))
  }, [index, bounds, zoom])

  return { clusters, supercluster: index }
}
