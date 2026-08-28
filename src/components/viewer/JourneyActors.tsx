import { RoundedBox, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { BRAND_ASSETS } from '@/config/brandAssets'
import { getJourney, journeyDuration } from '@/domain/journeys'
import { pedestrianCollisionAt } from '@/domain/journeySafety'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useViewerStore } from '@/stores/viewerStore'
import { dampAngle } from '@/three/angles'
import { FuelNozzleModel } from './FuelNozzleModel'

const gaze = new THREE.Vector3()

/**
 * Deliberately neutral procedural stand-in. The rejected imported character is
 * no longer loaded; this actor keeps the served journey understandable until a
 * coherent art-directed character and action-specific clips are approved.
 */
function PlaceholderPerson({
  uniform = 'attendant',
  holdingNozzle = false,
  rightArmRef,
  leftLegRef,
  rightLegRef,
  headRef,
}: {
  uniform?: 'attendant' | 'cashier'
  holdingNozzle?: boolean
  rightArmRef?: RefObject<THREE.Group | null>
  leftLegRef?: RefObject<THREE.Group | null>
  rightLegRef?: RefObject<THREE.Group | null>
  headRef?: RefObject<THREE.Group | null>
}) {
  const q8Logo = useTexture(BRAND_ASSETS.q8LogoWhite)
  const attendant = uniform === 'attendant'
  const shirt = attendant ? '#13337a' : '#f7f5ef'
  const trousers = attendant ? '#202a3a' : '#214a4b'
  const skin = attendant ? '#c98d73' : '#d7a087'

  return (
    <group>
      <RoundedBox
        args={[0.46, 0.72, 0.28]}
        radius={0.12}
        smoothness={4}
        position={[0, 1.17, 0]}
        castShadow
      >
        <meshStandardMaterial color={shirt} roughness={0.82} />
      </RoundedBox>
      <group ref={headRef} position={[0, 1.75, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.135, 0.12, 8, 18]} />
          <meshStandardMaterial color={skin} roughness={0.78} />
        </mesh>
        {attendant ? (
          <>
            <mesh position={[0, 0.21, 0]} castShadow>
              <cylinderGeometry args={[0.17, 0.15, 0.16, 24]} />
              <meshStandardMaterial color="#12327b" roughness={0.76} />
            </mesh>
            <RoundedBox
              args={[0.36, 0.045, 0.22]}
              radius={0.018}
              smoothness={3}
              position={[0, 0.16, 0.13]}
              castShadow
            >
              <meshStandardMaterial color="#12327b" roughness={0.76} />
            </RoundedBox>
          </>
        ) : (
          <mesh position={[0, 0.04, -0.06]} castShadow>
            <sphereGeometry args={[0.155, 20, 14]} />
            <meshStandardMaterial color="#5b392d" roughness={0.88} />
          </mesh>
        )}
      </group>
      {([-1, 1] as const).map((side) => (
        <group
          key={side}
          ref={side === 1 ? rightArmRef : undefined}
          position={[side * 0.29, 1.4, 0]}
        >
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.34, 6, 14]} />
            <meshStandardMaterial color={shirt} roughness={0.82} />
          </mesh>
          <mesh position={[0, -0.5, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.08, 6, 14]} />
            <meshStandardMaterial color={skin} roughness={0.78} />
          </mesh>
          {side === 1 && holdingNozzle && (
            <group
              position={[0.05, -0.53, 0.08]}
              rotation={[0.08, 0.42, -0.72]}
            >
              <FuelNozzleModel scale={0.56} />
            </group>
          )}
        </group>
      ))}
      {([-1, 1] as const).map((side) => (
        <group
          key={side}
          ref={side === -1 ? leftLegRef : rightLegRef}
          position={[side * 0.13, 0.68, 0]}
        >
          <mesh position={[0, -0.32, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.48, 6, 14]} />
            <meshStandardMaterial color={trousers} roughness={0.86} />
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
      {attendant ? (
        <mesh position={[0, 1.32, 0.148]}>
          <planeGeometry args={[0.22, 0.052]} />
          <meshStandardMaterial map={q8Logo} transparent roughness={0.72} />
        </mesh>
      ) : (
        <RoundedBox
          args={[0.22, 0.09, 0.035]}
          radius={0.02}
          smoothness={3}
          position={[0, 1.31, 0.15]}
        >
          <meshStandardMaterial color="#078b83" roughness={0.58} />
        </RoundedBox>
      )}
    </group>
  )
}

function SvoltaCashier({ paying }: { paying: boolean }) {
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
      position={[12.05, 0, -8.88]}
      rotation={[0, -0.88, 0]}
      name="svolta-cashier-placeholder"
    >
      <PlaceholderPerson uniform="cashier" rightArmRef={rightArm} />
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
  const head = useRef<THREE.Group>(null)
  const initialized = useRef(false)
  const actorElapsed = useRef(0)
  const actorStart = useRef(new THREE.Vector3())
  const actorDestination = useRef(new THREE.Vector3())
  const actorCandidate = useRef(new THREE.Vector3())
  const journey = getJourney(routeId)
  const step = journey.steps[activeStepIndex]
  const cue = mode === 'auto' ? step?.actor : undefined
  const operatorHoldsNozzle =
    step?.nozzle?.owner === 'attendant' &&
    step.nozzle.state !== 'holstered' &&
    step.nozzle.state !== 'returning'
  const locksFuelingPose = cue?.action === 'refuel'

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
    actorElapsed.current = THREE.MathUtils.clamp(
      usePlaybackStore.getState().progress * journeyDuration(journey) -
        elapsedBefore,
      0,
      step?.duration ?? 0,
    )
  }, [activeStepIndex, cue, journey, seekToken, step?.duration])

  useFrame((state, delta) => {
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
    actorCandidate.current
      .copy(actorStart.current)
      .lerp(actorDestination.current, THREE.MathUtils.smootherstep(local, 0, 1))
    if (!pedestrianCollisionAt(actorCandidate.current))
      attendant.current.position.copy(actorCandidate.current)

    const walking =
      actorStart.current.distanceToSquared(actorDestination.current) > 0.04 &&
      local < 0.98
    gaze.set(...cue.lookAt)
    if (
      walking &&
      actorDestination.current.distanceToSquared(attendant.current.position) >
        0.0025
    )
      gaze.copy(actorDestination.current)
    attendant.current.rotation.y = dampAngle(
      attendant.current.rotation.y,
      Math.atan2(
        gaze.x - attendant.current.position.x,
        gaze.z - attendant.current.position.z,
      ),
      8,
      delta,
    )

    const armTarget = operatorHoldsNozzle
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
    if (rightArm.current)
      rightArm.current.rotation.x = THREE.MathUtils.lerp(
        rightArm.current.rotation.x,
        armTarget,
        1 - Math.exp(-delta * 9),
      )

    const legSwing = walking ? Math.sin(actorElapsed.current * 5.4) * 0.34 : 0
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
    if (head.current) {
      const headYaw = locksFuelingPose
        ? Math.sin(state.clock.elapsedTime * 0.55) * 0.24
        : 0
      head.current.rotation.y = THREE.MathUtils.lerp(
        head.current.rotation.y,
        headYaw,
        1 - Math.exp(-delta * 4),
      )
    }
  })

  return (
    <>
      <group
        ref={attendant}
        visible={Boolean(cue)}
        name="q8-attendant-placeholder"
      >
        <PlaceholderPerson
          holdingNozzle={operatorHoldsNozzle}
          rightArmRef={rightArm}
          leftLegRef={leftLeg}
          rightLegRef={rightLeg}
          headRef={head}
        />
      </group>
      <SvoltaCashier paying={step?.id === 'svolta-payment'} />
    </>
  )
}
