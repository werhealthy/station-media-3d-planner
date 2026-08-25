import type { ConfigMediaPoint } from '@/domain/stationConfig'
import { useProjectStore } from '@/stores/projectStore'
import { MediaPointMarker } from './MediaPointMarker'
export function MediaPointsLayer({ points }: { points: ConfigMediaPoint[] }) {
  const hidden = useProjectStore((state) => state.hiddenMediaPointIds)
  return (
    <group>
      {points
        .filter((point) => !hidden.includes(point.id))
        .map((point) => (
          <MediaPointMarker key={point.id} point={point} />
        ))}
    </group>
  )
}
