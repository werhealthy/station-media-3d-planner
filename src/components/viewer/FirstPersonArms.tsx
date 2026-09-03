import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { getJourney } from '@/domain/journeys'
import { presentedCameraMode } from '@/domain/journeyPresentation'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useViewerStore } from '@/stores/viewerStore'

const cameraPosition = new THREE.Vector3()
const cameraQuaternion = new THREE.Quaternion()
const TERMINAL_TOUCH_STEPS = new Set([
  'self-terminal-start',
  'self-no-payback',
  'self-select-pump',
  'self-select-fuel',
  'self-select-payment',
  'self-review',
])

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
    Boolean(step && TERMINAL_TOUCH_STEPS.has(step.id))

  useFrame((state, delta) => {
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
    const swing = Math.sin(gaitPhase.current) * 0.09 * gaitWeight
    const lift = Math.abs(Math.sin(gaitPhase.current)) * 0.012 * gaitWeight
    const touchCycle = (state.clock.elapsedTime * 0.72) % 1
    const touchReach = terminalTouch
      ? THREE.MathUtils.smoothstep(touchCycle, 0.12, 0.3) *
        (1 - THREE.MathUtils.smoothstep(touchCycle, 0.48, 0.68))
      : 0
    leftArm.current.position.set(-0.42, -0.58, -0.72)
    rightArm.current.position.set(
      0.42 - touchReach * 0.32,
      -0.58 + touchReach * 0.28,
      -0.72 + touchReach * 0.1,
    )
    leftArm.current.rotation.x = swing
    rightArm.current.rotation.x = -swing - touchReach * 0.08
    rig.current.position.y += lift
  })

  return (
    <group ref={rig} renderOrder={8}>
      {([-1, 1] as const).map((side) => (
        <group
          key={side}
          ref={side === -1 ? leftArm : rightArm}
          position={[side * 0.42, -0.58, -0.72]}
        >
          <mesh rotation={[-1.02, 0, side * 0.06]} castShadow>
            <capsuleGeometry args={[0.09, 0.34, 7, 14]} />
            <meshStandardMaterial color="#17366f" roughness={0.82} />
          </mesh>
          <mesh
            position={[0, 0.28, -0.46]}
            rotation={[-0.12, 0, side * 0.04]}
            scale={[0.88, 0.78, 1.08]}
            castShadow
          >
            <sphereGeometry args={[0.105, 18, 12]} />
            <meshStandardMaterial color="#d59b7f" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
