import { RoundedBox } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getJourney, journeyDuration } from '@/domain/journeys'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useStationRuntimeStore } from '@/stores/stationRuntimeStore'
import { useViewerStore } from '@/stores/viewerStore'

const RACK = {
  self: new THREE.Vector3(-5.63, 1.33, 2.09),
  servito: new THREE.Vector3(3.57, 1.33, 2.09),
}
const FILLER = {
  self: new THREE.Vector3(-2.35, 1.05, 4.75),
  servito: new THREE.Vector3(6.75, 1.05, 4.75),
}

function belongsToPump(object: THREE.Object3D, pumpName: string) {
  let current: THREE.Object3D | null = object
  while (current) {
    if (current.name === pumpName) return true
    current = current.parent
  }
  return false
}

export function JourneyFuelNozzle() {
  const mode = useViewerStore((state) => state.navigationMode)
  const routeId = usePlaybackStore((state) => state.activeRouteId)
  const activeStepIndex = usePlaybackStore((state) => state.activeStepIndex)
  const root = useStationRuntimeStore((state) => state.root)
  const { camera } = useThree()
  const nozzle = useRef<THREE.Group>(null)
  const start = useMemo(() => new THREE.Vector3(), [])
  const destination = useMemo(() => new THREE.Vector3(), [])
  const journey = getJourney(routeId)
  const step = journey.steps[activeStepIndex]
  const cue = mode === 'auto' ? step?.nozzle : undefined
  const rack = cue ? RACK[cue.pump] : RACK.self
  const filler = cue ? FILLER[cue.pump] : FILLER.self
  const worldVisible = Boolean(
    cue && ['inserting', 'inserted', 'removing', 'returning'].includes(cue.state),
  )

  const hoseGeometry = useMemo(() => {
    const points = [
      rack.clone(),
      rack.clone().add(new THREE.Vector3(0, -0.9, 0.22)),
      filler.clone().add(new THREE.Vector3(0, -0.7, -0.15)),
      filler.clone(),
    ]
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points, false, 'centripetal'),
      30,
      0.025,
      10,
      false,
    )
  }, [filler, rack])

  useEffect(() => () => hoseGeometry.dispose(), [hoseGeometry])

  useEffect(() => {
    if (!root) return
    const pumpName = cue?.pump === 'servito' ? 'fuel-dispenser-21' : 'fuel-dispenser-11'
    root.traverse((object) => {
      if (object.name !== 'q8-easy-nozzle-0') return
      object.visible =
        !cue || cue.state === 'holstered' || !belongsToPump(object, pumpName)
    })
    return () => {
      root.traverse((object) => {
        if (object.name === 'q8-easy-nozzle-0') object.visible = true
      })
    }
  }, [cue, root])

  useFrame(() => {
    if (!nozzle.current || !cue || !worldVisible) return
    const elapsedBefore = journey.steps
      .slice(0, activeStepIndex)
      .reduce((total, item) => total + item.duration, 0)
    const elapsed =
      usePlaybackStore.getState().progress * journeyDuration(journey) -
      elapsedBefore
    const local = THREE.MathUtils.clamp(
      elapsed / Math.max(step?.duration ?? 0.001, 0.001),
      0,
      1,
    )
    const amount = THREE.MathUtils.smoothstep(local, 0, 1)

    if (cue.owner === 'driver') {
      start
        .set(0.18, -0.28, -0.62)
        .applyQuaternion(camera.quaternion)
        .add(camera.position)
    } else {
      start.set(
        (step?.actor?.position[0] ?? filler.x) + 0.25,
        1.02,
        (step?.actor?.position[2] ?? filler.z) + 0.12,
      )
    }

    if (cue.state === 'inserted') destination.copy(filler)
    else if (cue.state === 'inserting')
      destination.copy(start).lerp(filler, amount)
    else if (cue.state === 'removing')
      destination.copy(filler).lerp(start, amount)
    else destination.copy(start).lerp(rack, amount)

    nozzle.current.position.copy(destination)
    nozzle.current.rotation.set(
      cue.state === 'inserted' ? -0.25 : 0.1,
      cue.pump === 'self' ? -0.55 : 0.55,
      cue.state === 'inserted' ? Math.PI / 2 : 0,
    )
  })

  return (
    <>
      <group ref={nozzle} visible={worldVisible}>
        <RoundedBox
          args={[0.11, 0.16, 0.28]}
          radius={0.022}
          smoothness={3}
          castShadow
        >
          <meshStandardMaterial color="#20252b" metalness={0.2} roughness={0.48} />
        </RoundedBox>
        <mesh position={[0, 0.07, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.02, 0.3, 12]} />
          <meshStandardMaterial color="#c7cbd0" metalness={0.72} roughness={0.28} />
        </mesh>
      </group>
      <mesh
        geometry={hoseGeometry}
        visible={Boolean(cue && cue.state === 'inserted')}
        castShadow
      >
        <meshStandardMaterial color="#101317" roughness={0.9} />
      </mesh>
    </>
  )
}
