import { RoundedBox } from '@react-three/drei'
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
  const vehicleYaw = useRef(-Math.PI / 2)
  const forward = useRef(new THREE.Vector3())
  const step = getJourney(activeRouteId).steps[activeStepIndex]
  const visible = mode === 'auto' && step?.cameraMode === 'vehicle'
  const parkedCarVisible =
    mode === 'auto' &&
    activeRouteId === 'self-service' &&
    step?.cameraMode === 'pedestrian' &&
    step.id !== 'self-exit'

  useFrame((_, delta) => {
    if (!cockpit.current || !visible) return
    const carIsMoving = step.motion === 'drive' || step.motion === 'brake'
    let desiredYaw = step.vehicleYaw ?? vehicleYaw.current
    if (carIsMoving) {
      cockpit.current.position.copy(camera.position)
      camera.getWorldDirection(forward.current)
      forward.current.y = 0
      if (forward.current.lengthSq() > 0.001) {
        forward.current.normalize()
        desiredYaw = Math.atan2(-forward.current.x, -forward.current.z)
      }
    } else cockpit.current.position.set(...step.position)
    vehicleYaw.current = THREE.MathUtils.lerp(
      vehicleYaw.current,
      desiredYaw,
      1 - Math.exp(-delta * (carIsMoving ? 10 : 5)),
    )
    cockpit.current.rotation.set(0, vehicleYaw.current, 0)
  })

  return (
    <>
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
        {([-1, 1] as const).map((side) => (
          <group key={side}>
            <mesh
              position={[side * 0.24, -0.51, -0.59]}
              rotation={[1.03, 0, side * -0.18]}
              castShadow
            >
              <cylinderGeometry args={[0.042, 0.057, 0.29, 18]} />
              <meshStandardMaterial color="#d99b82" roughness={0.72} />
            </mesh>
            <RoundedBox
              args={[0.09, 0.06, 0.13]}
              radius={0.022}
              smoothness={4}
              position={[side * 0.17, -0.34, -0.79]}
              rotation={[0.12, 0, side * -0.3]}
              castShadow
            >
              <meshStandardMaterial color="#d99b82" roughness={0.72} />
            </RoundedBox>
          </group>
        ))}
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

      <group
        visible={parkedCarVisible}
        position={[-5, 0, 7.2]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <RoundedBox
          args={[1.82, 0.52, 4.2]}
          radius={0.18}
          smoothness={5}
          position={[0, 0.57, 0]}
          castShadow
        >
          <meshStandardMaterial
            color="#202d57"
            metalness={0.45}
            roughness={0.28}
          />
        </RoundedBox>
        <RoundedBox
          args={[1.62, 0.7, 2.18]}
          radius={0.2}
          smoothness={5}
          position={[0, 1.05, -0.18]}
          castShadow
        >
          <meshStandardMaterial
            color="#1c3345"
            metalness={0.2}
            roughness={0.16}
          />
        </RoundedBox>
        {([-1, 1] as const).flatMap((side) =>
          [-1.35, 1.35].map((axle) => (
            <mesh
              key={`${side}-${axle}`}
              position={[side * 0.94, 0.38, axle]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.35, 0.35, 0.22, 24]} />
              <meshStandardMaterial color="#101419" roughness={0.82} />
            </mesh>
          )),
        )}
        <mesh position={[0, 0.66, -2.11]}>
          <boxGeometry args={[1.25, 0.16, 0.04]} />
          <meshStandardMaterial
            color="#e8f4ff"
            emissive="#d7ecff"
            emissiveIntensity={0.35}
          />
        </mesh>
        <mesh position={[0, 0.67, 2.11]}>
          <boxGeometry args={[1.28, 0.14, 0.04]} />
          <meshStandardMaterial
            color="#a51e2c"
            emissive="#8c1220"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
    </>
  )
}
