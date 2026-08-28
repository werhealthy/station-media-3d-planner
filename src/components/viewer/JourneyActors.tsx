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
import {
  advanceGaitPhase,
  gaitWeightForSpeed,
  sampleHumanGait,
  sampleIdleMotion,
} from '@/three/humanMotion'
import { FuelNozzleModel } from './FuelNozzleModel'

const gaze = new THREE.Vector3()

/**
 * A lightweight, art-directed proxy for the pitch. It uses a rounded silhouette
 * and two-joint legs so the procedural fallback reads as a stylised person, not
 * a stack of blocks. A production character can still replace it later.
 */
function StylizedStaffPerson({
  uniform = 'attendant',
  holdingNozzle = false,
  leftArmRef,
  rightArmRef,
  leftLegRef,
  rightLegRef,
  leftKneeRef,
  rightKneeRef,
  headRef,
}: {
  uniform?: 'attendant' | 'cashier'
  holdingNozzle?: boolean
  leftArmRef?: RefObject<THREE.Group | null>
  rightArmRef?: RefObject<THREE.Group | null>
  leftLegRef?: RefObject<THREE.Group | null>
  rightLegRef?: RefObject<THREE.Group | null>
  leftKneeRef?: RefObject<THREE.Group | null>
  rightKneeRef?: RefObject<THREE.Group | null>
  headRef?: RefObject<THREE.Group | null>
}) {
  const q8Logo = useTexture(BRAND_ASSETS.q8LogoWhite)
  const attendant = uniform === 'attendant'
  const shirt = '#13337a'
  const trousers = attendant ? '#202a3a' : '#263347'
  const skin = attendant ? '#c98d73' : '#d7a087'

  return (
    <group>
      <RoundedBox
        args={[0.47, 0.67, 0.27]}
        radius={0.13}
        smoothness={5}
        position={[0, 1.22, 0]}
        castShadow
      >
        <meshStandardMaterial color={shirt} roughness={0.82} />
      </RoundedBox>
      <RoundedBox
        args={[0.34, 0.2, 0.25]}
        radius={0.085}
        smoothness={4}
        position={[0, 0.82, 0]}
        castShadow
      >
        <meshStandardMaterial color={trousers} roughness={0.86} />
      </RoundedBox>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.085, 0.14, 16]} />
        <meshStandardMaterial color={skin} roughness={0.78} />
      </mesh>
      <group ref={headRef} position={[0, 1.79, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.14, 0.13, 8, 20]} />
          <meshStandardMaterial color={skin} roughness={0.78} />
        </mesh>
        {([-1, 1] as const).map((side) => (
          <mesh key={`ear-${side}`} position={[side * 0.145, 0.015, 0]}>
            <sphereGeometry args={[0.032, 12, 8]} />
            <meshStandardMaterial color={skin} roughness={0.78} />
          </mesh>
        ))}
        <mesh position={[0, 0.015, 0.144]} scale={[0.65, 0.9, 0.72]}>
          <sphereGeometry args={[0.035, 12, 8]} />
          <meshStandardMaterial color={skin} roughness={0.78} />
        </mesh>
        {([-1, 1] as const).map((side) => (
          <mesh key={`eye-${side}`} position={[side * 0.052, 0.055, 0.132]}>
            <sphereGeometry args={[0.012, 10, 8]} />
            <meshStandardMaterial color="#28313a" roughness={0.48} />
          </mesh>
        ))}
        {attendant ? (
          <>
            <mesh position={[0, 0.22, -0.005]} castShadow>
              <cylinderGeometry args={[0.17, 0.15, 0.16, 24]} />
              <meshStandardMaterial color="#12327b" roughness={0.76} />
            </mesh>
            <RoundedBox
              args={[0.36, 0.045, 0.22]}
              radius={0.018}
              smoothness={3}
              position={[0, 0.17, 0.14]}
              castShadow
            >
              <meshStandardMaterial color="#12327b" roughness={0.76} />
            </RoundedBox>
          </>
        ) : (
          <mesh
            position={[0, 0.075, -0.07]}
            scale={[1.08, 1.12, 0.92]}
            castShadow
          >
            <sphereGeometry args={[0.16, 20, 14]} />
            <meshStandardMaterial color="#5b392d" roughness={0.88} />
          </mesh>
        )}
      </group>
      {([-1, 1] as const).map((side) => (
        <group
          key={side}
          ref={side === 1 ? rightArmRef : leftArmRef}
          position={[side * 0.285, 1.45, 0]}
        >
          <mesh position={[0, -0.18, 0]} castShadow>
            <capsuleGeometry args={[0.062, 0.22, 7, 16]} />
            <meshStandardMaterial color={shirt} roughness={0.82} />
          </mesh>
          <group position={[0, -0.34, 0]} rotation={[-0.1, 0, side * 0.025]}>
            <mesh position={[0, -0.16, 0.01]} castShadow>
              <capsuleGeometry args={[0.052, 0.2, 7, 15]} />
              <meshStandardMaterial color={skin} roughness={0.78} />
            </mesh>
            <RoundedBox
              args={[0.105, 0.13, 0.085]}
              radius={0.035}
              smoothness={4}
              position={[0, -0.34, 0.02]}
              castShadow
            >
              <meshStandardMaterial color={skin} roughness={0.78} />
            </RoundedBox>
            {side === 1 && holdingNozzle && (
              <group
                position={[0.05, -0.36, 0.1]}
                rotation={[0.08, 0.42, -0.72]}
              >
                <FuelNozzleModel scale={0.56} />
              </group>
            )}
          </group>
        </group>
      ))}
      {([-1, 1] as const).map((side) => (
        <group
          key={side}
          ref={side === -1 ? leftLegRef : rightLegRef}
          position={[side * 0.12, 0.76, 0]}
        >
          <mesh position={[0, -0.19, 0]} castShadow>
            <capsuleGeometry args={[0.078, 0.24, 7, 16]} />
            <meshStandardMaterial color={trousers} roughness={0.86} />
          </mesh>
          <group
            ref={side === -1 ? leftKneeRef : rightKneeRef}
            position={[0, -0.38, 0]}
          >
            <mesh position={[0, -0.19, 0]} castShadow>
              <capsuleGeometry args={[0.068, 0.24, 7, 16]} />
              <meshStandardMaterial color={trousers} roughness={0.86} />
            </mesh>
            <RoundedBox
              args={[0.17, 0.1, 0.34]}
              radius={0.04}
              smoothness={4}
              position={[0, -0.42, 0.075]}
              castShadow
            >
              <meshStandardMaterial color="#111722" roughness={0.7} />
            </RoundedBox>
          </group>
        </group>
      ))}
      <mesh position={[0, 1.34, 0.14]}>
        <planeGeometry args={[0.22, 0.052]} />
        <meshStandardMaterial map={q8Logo} transparent roughness={0.72} />
      </mesh>
    </group>
  )
}

function SvoltaCashier({ paying }: { paying: boolean }) {
  const person = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!person.current || !rightArm.current) return
    const idle = sampleIdleMotion(state.clock.elapsedTime + 2.1)
    person.current.position.y = idle.lift
    person.current.rotation.z = idle.sway
    const gesture = paying
      ? -0.78 + Math.sin(state.clock.elapsedTime * 2.2) * 0.08
      : -0.18
    rightArm.current.rotation.x = THREE.MathUtils.lerp(
      rightArm.current.rotation.x,
      gesture,
      1 - Math.exp(-delta * 7),
    )
    if (leftArm.current)
      leftArm.current.rotation.x = THREE.MathUtils.lerp(
        leftArm.current.rotation.x,
        -0.08 + idle.sway * 2,
        1 - Math.exp(-delta * 5),
      )
    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.lerp(
        head.current.rotation.y,
        paying ? -0.12 : idle.headYaw,
        1 - Math.exp(-delta * 4),
      )
      head.current.rotation.x = THREE.MathUtils.lerp(
        head.current.rotation.x,
        paying ? -0.055 : idle.headPitch,
        1 - Math.exp(-delta * 4),
      )
    }
  })

  return (
    <group
      position={[12.05, 0, -8.88]}
      rotation={[0, -0.88, 0]}
      name="svolta-cashier-stylized-proxy"
    >
      <group ref={person}>
        <StylizedStaffPerson
          uniform="cashier"
          leftArmRef={leftArm}
          rightArmRef={rightArm}
          headRef={head}
        />
      </group>
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
  const attendantMotion = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Group>(null)
  const rightLeg = useRef<THREE.Group>(null)
  const leftKnee = useRef<THREE.Group>(null)
  const rightKnee = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const initialized = useRef(false)
  const actorElapsed = useRef(0)
  const gaitPhase = useRef(0)
  const gaitBlend = useRef(0)
  const actorStart = useRef(new THREE.Vector3())
  const actorDestination = useRef(new THREE.Vector3())
  const actorCandidate = useRef(new THREE.Vector3())
  const previousActorPosition = useRef(new THREE.Vector3())
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
    previousActorPosition.current.copy(actorStart.current)
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
      previousActorPosition.current.copy(actorStart.current)
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

    const distanceThisFrame = attendant.current.position.distanceTo(
      previousActorPosition.current,
    )
    previousActorPosition.current.copy(attendant.current.position)
    const measuredSpeed = walking
      ? distanceThisFrame / Math.max(delta, 0.001)
      : 0
    gaitPhase.current = advanceGaitPhase(
      gaitPhase.current,
      walking ? distanceThisFrame : 0,
    )
    gaitBlend.current = THREE.MathUtils.lerp(
      gaitBlend.current,
      gaitWeightForSpeed(measuredSpeed),
      1 - Math.exp(-delta * (walking ? 9 : 7)),
    )
    const gait = sampleHumanGait(gaitPhase.current, gaitBlend.current)
    const idle = sampleIdleMotion(state.clock.elapsedTime)
    const idleWeight = 1 - gaitBlend.current
    if (attendantMotion.current) {
      attendantMotion.current.position.y = THREE.MathUtils.lerp(
        attendantMotion.current.position.y,
        gait.bodyLift + idle.lift * idleWeight,
        1 - Math.exp(-delta * 10),
      )
      attendantMotion.current.rotation.z = THREE.MathUtils.lerp(
        attendantMotion.current.rotation.z,
        gait.bodyRoll + idle.sway * idleWeight,
        1 - Math.exp(-delta * 8),
      )
    }

    const actionArmTarget = operatorHoldsNozzle
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
            : null
    if (leftArm.current)
      leftArm.current.rotation.x = THREE.MathUtils.lerp(
        leftArm.current.rotation.x,
        gait.leftArm - idle.sway * idleWeight,
        1 - Math.exp(-delta * 9),
      )
    if (rightArm.current)
      rightArm.current.rotation.x = THREE.MathUtils.lerp(
        rightArm.current.rotation.x,
        actionArmTarget ?? gait.rightArm + idle.sway * idleWeight,
        1 - Math.exp(-delta * 9),
      )

    const legSettle = 1 - Math.exp(-delta * 10)
    if (leftLeg.current && rightLeg.current) {
      leftLeg.current.rotation.x = THREE.MathUtils.lerp(
        leftLeg.current.rotation.x,
        gait.leftHip,
        legSettle,
      )
      rightLeg.current.rotation.x = THREE.MathUtils.lerp(
        rightLeg.current.rotation.x,
        gait.rightHip,
        legSettle,
      )
    }
    if (leftKnee.current && rightKnee.current) {
      leftKnee.current.rotation.x = THREE.MathUtils.lerp(
        leftKnee.current.rotation.x,
        gait.leftKnee,
        legSettle,
      )
      rightKnee.current.rotation.x = THREE.MathUtils.lerp(
        rightKnee.current.rotation.x,
        gait.rightKnee,
        legSettle,
      )
    }
    if (head.current) {
      const headYaw = locksFuelingPose
        ? Math.sin(state.clock.elapsedTime * 0.55) * 0.22
        : idle.headYaw * idleWeight
      head.current.rotation.y = THREE.MathUtils.lerp(
        head.current.rotation.y,
        headYaw,
        1 - Math.exp(-delta * 4),
      )
      head.current.rotation.x = THREE.MathUtils.lerp(
        head.current.rotation.x,
        idle.headPitch * idleWeight,
        1 - Math.exp(-delta * 4),
      )
    }
  })

  return (
    <>
      <group
        ref={attendant}
        visible={Boolean(cue)}
        name="q8-attendant-stylized-proxy"
      >
        <group ref={attendantMotion}>
          <StylizedStaffPerson
            holdingNozzle={operatorHoldsNozzle}
            leftArmRef={leftArm}
            rightArmRef={rightArm}
            leftLegRef={leftLeg}
            rightLegRef={rightLeg}
            leftKneeRef={leftKnee}
            rightKneeRef={rightKnee}
            headRef={head}
          />
        </group>
      </group>
      <SvoltaCashier paying={step?.id === 'svolta-payment'} />
    </>
  )
}
