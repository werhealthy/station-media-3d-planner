import type { ConfigMediaPoint } from '@/domain/stationConfig'
import { MediaPointMarker } from './MediaPointMarker'
export function MediaPointsLayer({ points }: { points: ConfigMediaPoint[] }) {
  return (
    <group>
      {points.map((point) => (
        <MediaPointMarker key={point.id} point={point} />
      ))}
    </group>
  )
}
