import { useProjectStore } from '@/stores/projectStore'
import { useViewerStore } from '@/stores/viewerStore'
import { AdvertisingPointMesh } from './AdvertisingPointMesh'

export function AdvertisingPointsLayer() {
  const getAllAdvertisingPoints = useProjectStore((s) => s.getAllAdvertisingPoints)
  const setSelectedObjectId = useViewerStore((s) => s.setSelectedObjectId)
  const showMarkers = useViewerStore((s) => s.showMarkers)

  if (!showMarkers) return null

  const banners = getAllAdvertisingPoints()

  return (
    <group name="advertisingPoints">
      {banners.map((banner) => (
        <AdvertisingPointMesh
          key={banner.id}
          banner={banner}
          onSelect={(id) => setSelectedObjectId(id)}
        />
      ))}
    </group>
  )
}
