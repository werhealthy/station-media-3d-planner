import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { getJourney } from '@/domain/journeys'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useViewerStore } from '@/stores/viewerStore'

export function JourneyVehicle() {
  const mode = useViewerStore((state) => state.navigationMode)
  const activeRouteId = usePlaybackStore((state) => state.activeRouteId)
  const activeStepIndex = usePlaybackStore((state) => state.activeStepIndex)
  const { camera } = useThree()
  const cockpit = useRef<THREE.Group>(null)
  const step = getJourney(activeRouteId).steps[activeStepIndex]
  const visible = mode === 'auto' && step?.cameraMode === 'vehicle'

  useFrame(() => {
    if (!cockpit.current || !visible) return
    cockpit.current.position.copy(camera.position)
    cockpit.current.quaternion.copy(camera.quaternion)
  })

  return (
    <group ref={cockpit} visible={visible}>
      <mesh position={[0, -0.58, -0.92]} receiveShadow>
        <boxGeometry args={[1.9, 0.32, 0.72]} />
        <meshStandardMaterial color="#171d27" roughness={0.72} />
      </mesh>
      <mesh position={[0, -0.37, -0.8]} rotation={[-0.18, 0, 0]}>
        <torusGeometry args={[0.23, 0.035, 12, 28]} />
        <meshStandardMaterial color="#252d38" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.37, -0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.08, 20]} />
        <meshStandardMaterial
          color="#111722"
          metalness={0.25}
          roughness={0.42}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.9, 0.2, -1.05]}
          rotation={[0, 0, side * -0.16]}
        >
          <boxGeometry args={[0.09, 1.65, 0.1]} />
          <meshStandardMaterial color="#1b2430" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.95, -1.08]}>
        <boxGeometry args={[1.82, 0.08, 0.08]} />
        <meshStandardMaterial color="#1b2430" roughness={0.6} />
      </mesh>
    </group>
  )
}
