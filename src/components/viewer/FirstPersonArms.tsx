import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { getJourney } from '@/domain/journeys'
import {
  isTerminalTouchStep,
  journeyStepLocalProgress,
  presentedCameraMode,
} from '@/domain/journeyPresentation'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useViewerStore } from '@/stores/viewerStore'

const cameraPosition = new THREE.Vector3()
const cameraQuaternion = new THREE.Quaternion()
export function FirstPersonArms() {
  const rig = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const lastPosition = useRef(new THREE.Vector3())
  const movementReady = useRef(false)
  const gaitPhase = useRef(0)
  const visibility = useRef(0)
  const { camera } = useThree()
  const mode = useViewerStore((state) => state.navigationMode)
  const routeId = usePlaybackStore((state) => state.activeRouteId)
  const activeStepIndex = usePlaybackStore((state) => state.activeStepIndex)
  const progress = usePlaybackStore((state) => state.progress)
  const isPlaying = usePlaybackStore((state) => state.isPlaying)
  const journey = getJourney(routeId)
  const step = journey.steps[activeStepIndex]
  const pedestrianView =
    presentedCameraMode(journey, activeStepIndex, progress) === 'pedestrian'
  const autoWalk =
    mode === 'auto' && isPlaying && pedestrianView && step?.motion === 'walk'
  const terminalTouch =
    mode === 'auto' &&
    isPlaying &&
    pedestrianView &&
    isTerminalTouchStep(step?.id)
  const stepProgress = journeyStepLocalProgress(
    journey,
    activeStepIndex,
    progress,
  )

  useFrame((_, delta) => {
    if (!rig.current || !leftArm.current || !rightArm.current) return
    camera.getWorldPosition(cameraPosition)
    camera.getWorldQuaternion(cameraQuaternion)

    const speed = movementReady.current
      ? cameraPosition.distanceTo(lastPosition.current) / Math.max(delta, 0.001)
      : 0
    movementReady.current = true
    lastPosition.current.copy(cameraPosition)

    const manualWalk = mode === 'walkthrough' && speed > 0.12
    const targetVisibility = autoWalk || manualWalk || terminalTouch ? 1 : 0
    visibility.current = THREE.MathUtils.lerp(
      visibility.current,
      targetVisibility,
      1 - Math.exp(-delta * 10),
    )
    rig.current.visible = visibility.current > 0.025
    rig.current.position.copy(cameraPosition)
    rig.current.quaternion.copy(cameraQuaternion)
    rig.current.scale.setScalar(visibility.current)

    const gaitWeight =
      Math.min(1, speed / 1.5) * (autoWalk || manualWalk ? 1 : 0)
    gaitPhase.current += delta * THREE.MathUtils.lerp(5.2, 7.2, gaitWeight)
    const swing = Math.sin(gaitPhase.current) * 0.055 * gaitWeight
    const lift = Math.abs(Math.sin(gaitPhase.current)) * 0.008 * gaitWeight
    const touchReach = terminalTouch
      ? THREE.MathUtils.smoothstep(stepProgress, 0.16, 0.42) *
        (1 - THREE.MathUtils.smoothstep(stepProgress, 0.58, 0.82))
      : 0
    leftArm.current.position.set(-0.29, -0.48, -0.38)
    rightArm.current.position.set(
      0.29 - touchReach * 0.045,
      -0.48 + touchReach * 0.12,
      -0.38 - touchReach * 0.34,
    )
    leftArm.current.rotation.x = swing
    rightArm.current.rotation.x = -swing - touchReach * 0.06
    rig.current.position.y += lift
  })

  return (
    <group ref={rig} renderOrder={8}>
      {([-1, 1] as const).map((side) => (
        <group
          key={side}
          ref={side === -1 ? leftArm : rightArm}
          position={[side * 0.29, -0.48, -0.38]}
        >
          <mesh
            position={[0, 0.1, -0.1]}
            rotation={[-0.73, 0, side * 0.035]}
            castShadow
          >
            <capsuleGeometry args={[0.09, 0.22, 5, 10]} />
            <meshStandardMaterial color="#17366f" roughness={0.82} />
          </mesh>
          <mesh
            position={[0, 0.255, -0.245]}
            rotation={[-0.76, 0, side * 0.035]}
            castShadow
          >
            <capsuleGeometry args={[0.068, 0.075, 5, 10]} />
            <meshStandardMaterial color="#d69a7d" roughness={0.8} />
          </mesh>
          <mesh
            position={[0, 0.335, -0.335]}
            rotation={[-0.08, 0, side * 0.035]}
            scale={[1.02, 0.72, 1.18]}
            castShadow
          >
            <dodecahedronGeometry args={[0.105, 0]} />
            <meshStandardMaterial color="#d59b7f" roughness={0.8} />
          </mesh>
          <mesh
            position={[side * -0.085, 0.31, -0.35]}
            rotation={[0, 0, side * 0.42]}
            castShadow
          >
            <capsuleGeometry args={[0.035, 0.055, 4, 8]} />
            <meshStandardMaterial color="#d59b7f" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
