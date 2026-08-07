import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useStationRuntimeStore } from '@/stores/stationRuntimeStore'
import { useStationSetupStore } from '@/stores/stationSetupStore'

export function StationDebugHelpers() {
  const bounds = useStationRuntimeStore((state) => state.bounds)
  const config = useStationSetupStore((state) => state.config)
  const selected = useStationSetupStore((state) => state.selectedMesh)
  const debug = useStationSetupStore((state) => state.debug)
  const path = config.walkPath.map((point) => point.position)
  return (
    <group name="station-setup-helpers" userData={{ stationHelper: true }}>
      {debug.bounds && bounds && (
        <box3Helper args={[new THREE.Box3(new THREE.Vector3(...bounds.min), new THREE.Vector3(...bounds.max)), '#22d3ee']} />
      )}
      {selected && (
        <box3Helper args={[new THREE.Box3(new THREE.Vector3(...selected.min), new THREE.Vector3(...selected.max)), '#facc15']} />
      )}
      {debug.ground && config.ground?.y !== undefined && bounds && (
        <gridHelper position={[bounds.center[0], config.ground.y + 0.01, bounds.center[2]]} args={[Math.max(bounds.size[0], bounds.size[2]), 20, '#22c55e', '#166534']} />
      )}
      {debug.hotspots && config.hotspots.map((hotspot) => (
        <mesh key={hotspot.id} position={hotspot.position}>
          <sphereGeometry args={[0.22]} />
          <meshBasicMaterial color="#a855f7" depthTest={false} />
        </mesh>
      ))}
      {debug.walkPath && path.length > 1 && <Line points={path} color="#f97316" lineWidth={3} />}
      {debug.walkPath && config.walkPath.map((point, index) => (
        <mesh key={point.id} position={point.position}>
          <sphereGeometry args={[0.18]} />
          <meshBasicMaterial color={index === 0 ? '#22c55e' : '#f97316'} />
        </mesh>
      ))}
    </group>
  )
}
