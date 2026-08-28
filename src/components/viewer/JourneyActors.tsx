import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { BRAND_ASSETS } from '@/config/brandAssets'
import { getJourney, journeyDuration } from '@/domain/journeys'
import { pedestrianCollisionAt } from '@/domain/journeySafety'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useViewerStore } from '@/stores/viewerStore'
import { dampAngle } from '@/three/angles'
import {
  AnimatedJourneyCharacter,
  type JourneyCharacterAnimation,
} from './AnimatedJourneyCharacter'

const gaze = new THREE.Vector3()

function SvoltaCashier({
  visible,
  paying,
  paused,
  playbackSpeed,
  lookAt,
}: {
  visible: boolean
  paying: boolean
  paused: boolean
  playbackSpeed: number
  lookAt?: readonly [number, number, number]
}) {
  return (
    <group
      visible={visible}
      position={[12.05, 0, -8.88]}
      rotation={[0, -0.88, 0]}
      name="svolta-cashier"
    >
      <Suspense fallback={null}>
        <AnimatedJourneyCharacter
          animation={paying ? 'Touchscreen' : 'Idle'}
          paused={paused}
          playbackSpeed={paying ? playbackSpeed * 2.8 : playbackSpeed}
          headLookAt={lookAt}
        />
      </Suspense>
    </group>
  )
}

function animationForAction(
  cue: ReturnType<typeof getJourney>['steps'][number]['actor'],
): JourneyCharacterAnimation {
  if (!cue) return 'Idle'
  if (['approach', 'carry-nozzle', 'return'].includes(cue.action))
    return 'Walking'
  if (cue.action === 'payment') return 'Touchscreen'
  return 'Idle'
}

export function JourneyActors() {
  const mode = useViewerStore((state) => state.navigationMode)
  const routeId = usePlaybackStore((state) => state.activeRouteId)
  const activeStepIndex = usePlaybackStore((state) => state.activeStepIndex)
  const isPlaying = usePlaybackStore((state) => state.isPlaying)
  const playbackSpeed = usePlaybackStore((state) => state.playbackSpeed)
  const seekToken = usePlaybackStore((state) => state.seekToken)
  const attendant = useRef<THREE.Group>(null)
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
    step?.nozzle?.owner === 'attendant' &&
    step.nozzle.state !== 'holstered' &&
    step.nozzle.state !== 'returning'
  const attendantAnimation = animationForAction(cue)
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
    const travel = THREE.MathUtils.smootherstep(local, 0, 1)
    actorCandidate.current
      .copy(actorStart.current)
      .lerp(actorDestination.current, travel)
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
    const yaw = Math.atan2(
      gaze.x - attendant.current.position.x,
      gaze.z - attendant.current.position.z,
    )
    attendant.current.rotation.y = dampAngle(
      attendant.current.rotation.y,
      yaw,
      8,
      delta,
    )
  })

  return (
    <>
      <group ref={attendant} visible={Boolean(cue)} name="q8-attendant">
        <Suspense fallback={null}>
          <AnimatedJourneyCharacter
            animation={attendantAnimation}
            paused={!isPlaying}
            playbackSpeed={
              playbackSpeed * (attendantAnimation === 'Walking' ? 0.88 : 1)
            }
            holdingNozzle={operatorHoldsNozzle}
            headLookAt={locksFuelingPose ? step?.gazeTarget : undefined}
            headScan={locksFuelingPose}
            lockArms={locksFuelingPose}
          />
        </Suspense>
        <mesh position={[0, 1.34, 0.19]}>
          <planeGeometry args={[0.22, 0.052]} />
          <meshStandardMaterial map={q8Logo} transparent roughness={0.72} />
        </mesh>
      </group>
      <SvoltaCashier
        visible
        paying={step?.id === 'svolta-payment'}
        paused={!isPlaying && mode === 'auto'}
        playbackSpeed={playbackSpeed}
        lookAt={step?.id === 'svolta-payment' ? step.position : undefined}
      />
    </>
  )
}
