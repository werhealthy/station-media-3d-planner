import { RoundedBox, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getJourney, journeyDuration } from '@/domain/journeys'
import { pedestrianCollisionAt } from '@/domain/journeySafety'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useViewerStore } from '@/stores/viewerStore'
import { BRAND_ASSETS } from '@/config/brandAssets'

const gaze = new THREE.Vector3()

function SvoltaCashier({
  visible,
  paying,
}: {
  visible: boolean
  paying: boolean
}) {
  const rightArm = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!rightArm.current) return
    const gesture = paying
      ? -0.78 + Math.sin(state.clock.elapsedTime * 2.2) * 0.08
      : -0.18
    rightArm.current.rotation.x = THREE.MathUtils.lerp(
      rightArm.current.rotation.x,
      gesture,
      1 - Math.exp(-delta * 7),
    )
  })

  return (
    <group
      visible={visible}
      position={[12.05, 0, -8.88]}
      rotation={[0, -0.88, 0]}
      name="svolta-cashier"
    >
      <RoundedBox
        args={[0.44, 0.66, 0.27]}
        radius={0.11}
        smoothness={4}
        position={[0, 1.18, 0]}
        castShadow
      >
        <meshStandardMaterial color="#f7f5ef" roughness={0.8} />
      </RoundedBox>
      <RoundedBox
        args={[0.22, 0.09, 0.035]}
        radius={0.02}
        smoothness={3}
        position={[0, 1.31, 0.15]}
      >
        <meshStandardMaterial color="#078b83" roughness={0.58} />
      </RoundedBox>
      <mesh position={[0, 1.72, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.12, 8, 18]} />
        <meshStandardMaterial color="#d7a087" roughness={0.76} />
      </mesh>
      <mesh position={[0, 1.79, -0.06]} castShadow>
        <sphereGeometry args={[0.155, 20, 14]} />
        <meshStandardMaterial color="#5b392d" roughness={0.88} />
      </mesh>
      <mesh position={[0.02, 1.64, -0.16]} castShadow>
        <sphereGeometry args={[0.1, 18, 12]} />
        <meshStandardMaterial color="#5b392d" roughness={0.88} />
      </mesh>
      {([-1, 1] as const).map((side) => (
        <group
          key={side}
          ref={side === 1 ? rightArm : undefined}
          position={[side * 0.27, 1.38, 0.02]}
        >
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.27, 6, 14]} />
            <meshStandardMaterial color="#f7f5ef" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.42, 0.01]} castShadow>
            <capsuleGeometry args={[0.048, 0.09, 6, 14]} />
            <meshStandardMaterial color="#d7a087" roughness={0.76} />
          </mesh>
        </group>
      ))}
      {([-1, 1] as const).map((side) => (
        <mesh key={side} position={[side * 0.12, 0.55, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.72, 6, 14]} />
          <meshStandardMaterial color="#214a4b" roughness={0.86} />
        </mesh>
      ))}
    </group>
  )
}

export function JourneyActors() {
  const mode = useViewerStore((state) => state.navigationMode)
  const routeId = usePlaybackStore((state) => state.activeRouteId)
  const activeStepIndex = usePlaybackStore((state) => state.activeStepIndex)
  const isPlaying = usePlaybackStore((state) => state.isPlaying)
  const playbackSpeed = usePlaybackStore((state) => state.playbackSpeed)
  const seekToken = usePlaybackStore((state) => state.seekToken)
  const attendant = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Group>(null)
  const rightLeg = useRef<THREE.Group>(null)
  const initialized = useRef(false)
  const actorElapsed = useRef(0)
  const actorStart = useRef(new THREE.Vector3())
  const actorDestination = useRef(new THREE.Vector3())
  const actorCandidate = useRef(new THREE.Vector3())
  const q8Logo = useTexture(BRAND_ASSETS.q8LogoWhite)
  const journey = getJourney(routeId)
  const step = journey.steps[activeStepIndex]
  const cue = mode === 'auto' ? step?.actor : undefined
  const operatorHoldsNozzle =
    step?.nozzle?.owner === 'attendant' && step.nozzle.state !== 'holstered'
  const cashierVisible = true

  useEffect(() => {
    if (!cue) {
      initialized.current = false
      return
    }
    if (attendant.current && initialized.current)
      actorStart.current.copy(attendant.current.position).setY(0)
    else actorStart.current.set(...cue.position)
    actorDestination.current.set(...cue.position)
    const elapsedBefore = journey.steps
      .slice(0, activeStepIndex)
      .reduce((total, item) => total + item.duration, 0)
    const currentProgress = usePlaybackStore.getState().progress
    actorElapsed.current = THREE.MathUtils.clamp(
      currentProgress * journeyDuration(journey) - elapsedBefore,
      0,
      step?.duration ?? 0,
    )
  }, [activeStepIndex, cue, journey, seekToken, step?.duration])

  useFrame((_, delta) => {
    if (!attendant.current || !cue) return
    if (!initialized.current) {
      attendant.current.position.copy(actorStart.current)
      initialized.current = true
    }
    if (isPlaying) actorElapsed.current += delta * playbackSpeed
    const local = THREE.MathUtils.clamp(
      actorElapsed.current / Math.max(step?.duration ?? 0.001, 0.001),
      0,
      1,
    )
    const travel = THREE.MathUtils.smoothstep(local, 0, 1)
    actorCandidate.current
      .copy(actorStart.current)
      .lerp(actorDestination.current, travel)
    if (!pedestrianCollisionAt(actorCandidate.current))
      attendant.current.position.copy(actorCandidate.current)
    const walking =
      actorStart.current.distanceToSquared(actorDestination.current) > 0.04 &&
      local < 0.98
    const walkCycle = actorElapsed.current * 5.4
    if (walking)
      attendant.current.position.y += Math.abs(Math.sin(walkCycle)) * 0.018
    gaze.set(...cue.lookAt)
    if (walking) gaze.copy(actorDestination.current)
    const yaw = Math.atan2(
      gaze.x - attendant.current.position.x,
      gaze.z - attendant.current.position.z,
    )
    attendant.current.rotation.y = THREE.MathUtils.lerp(
      attendant.current.rotation.y,
      yaw,
      1 - Math.exp(-delta * 8),
    )
    if (rightArm.current) {
      const raised = operatorHoldsNozzle
        ? -0.68
        : cue.action === 'payment'
          ? -1.02
          : [
                'take-nozzle',
                'carry-nozzle',
                'insert-nozzle',
                'remove-nozzle',
                'replace-nozzle',
              ].includes(cue.action)
            ? -0.62
            : cue.action === 'refuel'
              ? -0.2
              : 0
      rightArm.current.rotation.x = THREE.MathUtils.lerp(
        rightArm.current.rotation.x,
        raised,
        1 - Math.exp(-delta * 9),
      )
    }
    const legSwing = walking ? Math.sin(walkCycle) * 0.34 : 0
    const legSettle = 1 - Math.exp(-delta * 10)
    if (leftLeg.current && rightLeg.current) {
      leftLeg.current.rotation.x = THREE.MathUtils.lerp(
        leftLeg.current.rotation.x,
        legSwing,
        legSettle,
      )
      rightLeg.current.rotation.x = THREE.MathUtils.lerp(
        rightLeg.current.rotation.x,
        -legSwing,
        legSettle,
      )
    }
  })

  return (
    <>
      <group ref={attendant} visible={Boolean(cue)}>
        <RoundedBox
          args={[0.46, 0.72, 0.28]}
          radius={0.12}
          smoothness={4}
          position={[0, 1.17, 0]}
          castShadow
        >
          <meshStandardMaterial color="#13337a" roughness={0.82} />
        </RoundedBox>
        <mesh position={[0, 1.75, 0]} castShadow>
          <capsuleGeometry args={[0.135, 0.12, 8, 18]} />
          <meshStandardMaterial color="#c98d73" roughness={0.78} />
        </mesh>
        <mesh position={[0, 1.96, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.15, 0.16, 24]} />
          <meshStandardMaterial color="#12327b" roughness={0.76} />
        </mesh>
        <RoundedBox
          args={[0.36, 0.045, 0.22]}
          radius={0.018}
          smoothness={3}
          position={[0, 1.91, 0.13]}
          castShadow
        >
          <meshStandardMaterial color="#12327b" roughness={0.76} />
        </RoundedBox>
        <mesh position={[0, 1.97, 0.174]}>
          <planeGeometry args={[0.19, 0.049]} />
          <meshBasicMaterial map={q8Logo} transparent toneMapped={false} />
        </mesh>
        {([-1, 1] as const).map((side) => (
          <group
            key={side}
            ref={side === 1 ? rightArm : undefined}
            position={[side * 0.29, 1.4, 0]}
          >
            <mesh position={[0, -0.24, 0]} castShadow>
              <capsuleGeometry args={[0.06, 0.34, 6, 14]} />
              <meshStandardMaterial color="#173b8d" roughness={0.82} />
            </mesh>
            <mesh position={[0, -0.5, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.08, 6, 14]} />
              <meshStandardMaterial color="#c98d73" roughness={0.78} />
            </mesh>
          </group>
        ))}
        {([-1, 1] as const).map((side) => (
          <group
            key={side}
            ref={side === -1 ? leftLeg : rightLeg}
            position={[side * 0.13, 0.68, 0]}
          >
            <mesh position={[0, -0.32, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.48, 6, 14]} />
              <meshStandardMaterial color="#202a3a" roughness={0.86} />
            </mesh>
            <RoundedBox
              args={[0.17, 0.1, 0.34]}
              radius={0.04}
              smoothness={3}
              position={[0, -0.66, -0.025]}
              castShadow
            >
              <meshStandardMaterial color="#111722" roughness={0.7} />
            </RoundedBox>
          </group>
        ))}
        <mesh position={[0, 1.32, 0.148]}>
          <planeGeometry args={[0.22, 0.057]} />
          <meshBasicMaterial map={q8Logo} transparent toneMapped={false} />
        </mesh>
      </group>
      <SvoltaCashier
        visible={cashierVisible}
        paying={step?.id === 'svolta-payment'}
      />
    </>
  )
}
