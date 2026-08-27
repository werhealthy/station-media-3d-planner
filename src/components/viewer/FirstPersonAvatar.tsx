import { RoundedBox } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { getJourney, journeyDuration } from '@/domain/journeys'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useViewerStore } from '@/stores/viewerStore'

const skin = new THREE.MeshStandardMaterial({
  color: '#d99b82',
  roughness: 0.72,
})
const sleeve = new THREE.MeshStandardMaterial({
  color: '#25324a',
  roughness: 0.82,
})
interface ArmProps {
  side: -1 | 1
  armRef: RefObject<THREE.Group | null>
  paying: boolean
}

function Arm({ side, armRef, paying }: ArmProps) {
  const isActionHand = side === 1
  return (
    <group ref={armRef} position={[side * 0.19, -0.23, -0.48]}>
      <mesh
        position={[side * 0.015, -0.015, 0.095]}
        rotation={[1.18, 0, side * -0.09]}
        castShadow
        material={sleeve}
      >
        <cylinderGeometry args={[0.052, 0.07, 0.18, 20]} />
      </mesh>
      <mesh
        position={[side * 0.018, -0.065, -0.065]}
        rotation={[1.18, 0, side * -0.08]}
        castShadow
        material={skin}
      >
        <cylinderGeometry args={[0.043, 0.054, 0.25, 20]} />
      </mesh>
      <RoundedBox
        args={[0.095, 0.055, 0.135]}
        radius={0.022}
        smoothness={4}
        position={[side * 0.02, -0.11, -0.205]}
        rotation={[0.18, side * 0.03, side * -0.04]}
        castShadow
        material={skin}
      />
      {isActionHand && paying && (
        <group
          position={[0.015, -0.095, -0.285]}
          rotation={[0.18, -0.12, 0.03]}
        >
          <RoundedBox args={[0.09, 0.005, 0.145]} radius={0.006} smoothness={2}>
            <meshStandardMaterial color="#84ad72" roughness={0.46} />
          </RoundedBox>
          <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.034, 0.11]} />
            <meshStandardMaterial color="#326d4e" roughness={0.5} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/**
 * Camera-local first-person viewmodel. Short segmented forearms and compact fists
 * stay in the lower peripheral view at every selected user height.
 */
export function FirstPersonAvatar() {
  const mode = useViewerStore((state) => state.navigationMode)
  const personHeight = useViewerStore((state) => state.personHeight)
  const routeId = usePlaybackStore((state) => state.activeRouteId)
  const activeStepIndex = usePlaybackStore((state) => state.activeStepIndex)
  const { camera } = useThree()
  const body = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const lastPosition = useRef(new THREE.Vector3())
  const gait = useRef(0)
  const step = getJourney(routeId).steps[activeStepIndex]
  const journey = getJourney(routeId)
  const autoPedestrian = mode === 'auto' && step?.cameraMode === 'pedestrian'
  const visible =
    mode === 'walkthrough' ||
    (autoPedestrian && step?.cameraTransition !== 'character-cut')
  const paying =
    mode === 'auto' &&
    (step?.id === 'self-insert-cash' ||
      step?.id === 'served-payment' ||
      step?.id === 'svolta-payment')
  const holdingNozzle =
    mode === 'auto' &&
    step?.nozzle?.owner === 'driver' &&
    step.nozzle.state !== 'holstered'
  const tapStep =
    mode === 'auto' &&
    Boolean(
      step &&
      [
        'self-terminal-start',
        'self-no-payback',
        'self-select-pump',
        'self-select-fuel',
        'self-select-payment',
        'self-review',
      ].includes(step.id),
    )

  useFrame((_, delta) => {
    if (!body.current || !visible) {
      lastPosition.current.copy(camera.position)
      return
    }

    const dx = camera.position.x - lastPosition.current.x
    const dz = camera.position.z - lastPosition.current.z
    const horizontalSpeed = Math.hypot(dx, dz) / Math.max(delta, 0.001)
    lastPosition.current.copy(camera.position)
    const moving = horizontalSpeed > 0.18
    if (moving) gait.current += delta * Math.min(horizontalSpeed, 2.4) * 4.6

    body.current.position.copy(camera.position)
    body.current.quaternion.copy(camera.quaternion)
    body.current.scale.setScalar(
      THREE.MathUtils.clamp(personHeight / 1.8, 0.86, 1.12),
    )

    const settle = 1 - Math.exp(-delta * 14)
    const swing = moving ? Math.sin(gait.current) * 0.055 : 0
    const breathe = Math.sin(gait.current * 0.35) * 0.006
    if (leftArm.current && rightArm.current) {
      leftArm.current.rotation.x = THREE.MathUtils.lerp(
        leftArm.current.rotation.x,
        swing + breathe,
        settle,
      )
      const elapsedBefore = journey.steps
        .slice(0, activeStepIndex)
        .reduce((total, item) => total + item.duration, 0)
      const local = step
        ? THREE.MathUtils.clamp(
            (usePlaybackStore.getState().progress * journeyDuration(journey) -
              elapsedBefore) /
              Math.max(step.duration, 0.001),
            0,
            1,
          )
        : 0
      // One reach-and-release pulse at the end of each actionable screen.
      const tapPhase = THREE.MathUtils.clamp((local - 0.56) / 0.4, 0, 1)
      const tapExtension = tapStep ? Math.sin(tapPhase * Math.PI) : 0
      const paymentPhase = THREE.MathUtils.clamp((local - 0.2) / 0.62, 0, 1)
      const paymentExtension = paying
        ? Math.sin(paymentPhase * Math.PI) * 0.9
        : 0
      const extension = Math.max(
        tapExtension,
        paymentExtension,
        holdingNozzle ? 0.72 : 0,
      )
      rightArm.current.rotation.x = THREE.MathUtils.lerp(
        rightArm.current.rotation.x,
        -swing + breathe - extension * 0.08,
        settle,
      )
      rightArm.current.position.x = THREE.MathUtils.lerp(
        rightArm.current.position.x,
        holdingNozzle ? 0.28 : 0.19 - extension * 0.03,
        settle,
      )
      rightArm.current.position.y = THREE.MathUtils.lerp(
        rightArm.current.position.y,
        holdingNozzle ? -0.28 : -0.23,
        settle,
      )
      rightArm.current.position.z = THREE.MathUtils.lerp(
        rightArm.current.position.z,
        -0.48 - extension * 0.5,
        settle,
      )
    }
  })

  return (
    <group ref={body} visible={visible}>
      <Arm side={-1} armRef={leftArm} paying={paying} />
      <Arm side={1} armRef={rightArm} paying={paying} />
    </group>
  )
}
