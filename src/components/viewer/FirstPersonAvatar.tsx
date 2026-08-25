import { RoundedBox } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { getJourney } from '@/domain/journeys'
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
const nozzle = new THREE.MeshStandardMaterial({
  color: '#20252b',
  metalness: 0.2,
  roughness: 0.48,
})

interface ArmProps {
  side: -1 | 1
  armRef: RefObject<THREE.Group | null>
  refueling: boolean
}

function Arm({ side, armRef, refueling }: ArmProps) {
  const isNozzleHand = refueling && side === 1
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
      {isNozzleHand && (
        <group position={[0.015, -0.095, -0.26]} rotation={[0.02, -0.17, 0]}>
          <RoundedBox
            args={[0.075, 0.095, 0.22]}
            radius={0.018}
            smoothness={3}
            material={nozzle}
          />
          <mesh position={[0, 0.055, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.014, 0.019, 0.22, 12]} />
            <meshStandardMaterial
              color="#c7cbd0"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0.065, 0.005, 0.03]} rotation={[0, 0, -0.35]}>
            <torusGeometry args={[0.065, 0.01, 8, 18, Math.PI * 1.4]} />
            <meshStandardMaterial color="#111418" roughness={0.65} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/**
 * Camera-local first-person viewmodel. Short segmented forearms and flat hands
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
  const autoPedestrian = mode === 'auto' && step?.cameraMode === 'pedestrian'
  const visible = mode === 'walkthrough' || autoPedestrian
  const refueling = mode === 'auto' && step?.id === 'self-refuel'

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
      rightArm.current.rotation.x = THREE.MathUtils.lerp(
        rightArm.current.rotation.x,
        -swing + breathe,
        settle,
      )
    }
  })

  return (
    <group ref={body} visible={visible}>
      <Arm side={-1} armRef={leftArm} refueling={refueling} />
      <Arm side={1} armRef={rightArm} refueling={refueling} />
    </group>
  )
}
