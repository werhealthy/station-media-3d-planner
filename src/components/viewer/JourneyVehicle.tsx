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
  const previousCameraPosition = useRef(new THREE.Vector3())
  const movementReady = useRef(false)
  const journey = getJourney(activeRouteId)
  const step = journey.steps[activeStepIndex]
  const visible = mode === 'auto' && step?.cameraMode === 'vehicle'
  const phoneVisible = visible && step?.id === 'served-dwell-phone'
  const parkedCarVisible =
    mode === 'auto' &&
    Boolean(journey.parkedVehicle) &&
    step?.cameraMode === 'pedestrian' &&
    step.motion !== 'exit'

  useFrame((_, delta) => {
    if (!cockpit.current || !visible) {
      movementReady.current = false
      return
    }
    const carIsMoving = step.motion === 'drive' || step.motion === 'brake'
    let desiredYaw = step.vehicleYaw ?? vehicleYaw.current
    if (carIsMoving) {
      cockpit.current.position.copy(camera.position)
      if (movementReady.current) {
        forward.current.subVectors(
          camera.position,
          previousCameraPosition.current,
        )
        forward.current.y = 0
      }
      if (movementReady.current && forward.current.lengthSq() > 0.0000001) {
        forward.current.normalize()
        desiredYaw = Math.atan2(-forward.current.x, -forward.current.z)
      }
      previousCameraPosition.current.copy(camera.position)
      movementReady.current = true
    } else {
      cockpit.current.position.set(...step.position)
      movementReady.current = false
    }
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
        {/* Closed-car reference frame: windscreen, roof liner and side windows
            keep the in-car POV consistent with the visible hatchback. */}
        <mesh position={[0, 0.16, -1.28]} rotation={[-0.26, 0, 0]}>
          <planeGeometry args={[1.66, 1.04]} />
          <meshStandardMaterial color="#a9c8de" transparent opacity={0.18} roughness={0.08} />
        </mesh>
        <mesh position={[0, 1.02, -0.22]}>
          <boxGeometry args={[1.78, 0.14, 2.05]} />
          <meshStandardMaterial color="#171d27" roughness={0.8} />
        </mesh>
        {([-1, 1] as const).map((side) => (
          <group key={`window-${side}`}>
            <mesh position={[side * 0.88, 0.18, -0.18]} rotation={[0, side * Math.PI / 2, 0]}>
              <planeGeometry args={[1.7, 0.8]} />
              <meshStandardMaterial color="#9fc4de" transparent opacity={0.12} roughness={0.1} />
            </mesh>
            <mesh position={[side * 0.8, 0.22, -1.05]} rotation={[0, 0, side * -0.24]}>
              <boxGeometry args={[0.11, 1.5, 0.12]} />
              <meshStandardMaterial color="#1b2430" roughness={0.6} />
            </mesh>
          </group>
        ))}
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
        <group visible={phoneVisible} position={[0.28, -0.43, -0.54]} rotation={[-0.68, -0.12, 0.08]}>
          <RoundedBox args={[0.17, 0.025, 0.31]} radius={0.025} smoothness={3}>
            <meshStandardMaterial color="#171a20" roughness={0.36} />
          </RoundedBox>
          <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.13, 0.25]} />
            <meshStandardMaterial color="#65b7d6" emissive="#317b9d" emissiveIntensity={0.7} />
          </mesh>
        </group>
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
        position={journey.parkedVehicle?.position ?? [0, 0, 0]}
        rotation={[0, journey.parkedVehicle?.yaw ?? 0, 0]}
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
        {/* Sportello e bocchettone sono parte dell'auto: l'ugello animato
            raggiunge questo punto, invece di generare un secondo raccordo. */}
        <group position={[0.92, 0.98, 1.35]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <circleGeometry args={[0.12, 24]} />
            <meshStandardMaterial color="#101419" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.008]}>
            <torusGeometry args={[0.105, 0.018, 10, 24]} />
            <meshStandardMaterial
              color="#8b94a3"
              metalness={0.55}
              roughness={0.34}
            />
          </mesh>
        </group>
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
