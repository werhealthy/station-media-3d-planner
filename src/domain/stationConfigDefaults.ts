import { HOTSPOTS } from './hotspots'
import { MEDIA_POINTS } from './mediaPoints'
import { WALKTHROUGH_ROUTE } from './walkthroughRoute'
import { StationConfigSchema, type StationConfig } from './stationConfig'

export const PROCEDURAL_STATION_CONFIG: StationConfig = StationConfigSchema.parse({
  version: 1,
  stationId: 'low-poly',
  modelType: 'procedural',
  transform: { scale: [1, 1, 1], position: [0, 0, 0], rotation: [0, 0, 0] },
  hiddenMeshes: [],
  ground: { y: 0, normal: [0, 1, 0] },
  overviewCamera: { position: [31, 19, 34], target: [1, 2, -2], fov: 42 },
  hotspots: HOTSPOTS,
  mediaPoints: MEDIA_POINTS.map((point) => ({ ...point, normal: [0, 0, 1] })),
  walkPath: WALKTHROUGH_ROUTE.map((point) => ({
    id: point.id,
    position: point.position,
    lookAt: point.gazeTarget,
    lookAtMediaPointId: point.mediaPointId,
    dwellTime: point.dwellSeconds,
  })),
})
