import { MEDIA_POINTS } from '@/domain/mediaPoints'
import { MediaPointMarker } from './MediaPointMarker'
export function MediaPointsLayer() {
  return (
    <group>
      {MEDIA_POINTS.map((point) => (
        <MediaPointMarker key={point.id} point={point} />
      ))}
    </group>
  )
}
