import { RoundedBox } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getJourney } from '@/domain/journeys'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useStationRuntimeStore } from '@/stores/stationRuntimeStore'
import { useViewerStore } from '@/stores/viewerStore'

const RACK = {
  self: new THREE.Vector3(-5.63, 1.33, 2.09),
  servito: new THREE.Vector3(3.57, 1.33, 2.09),
}
const FILLER = {
  self: new THREE.Vector3(-3.25, 0.72, 4.75),
  servito: new THREE.Vector3(5.95, 0.72, 4.75),
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
  // The prop stays visible from the instant it is taken from the rack: this
  // avoids the distracting "appears already in the filler" jump.
  const worldVisible = Boolean(cue && cue.state !== 'holstered')

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

    if (cue.state === 'hand' || cue.state === 'removing') destination.copy(start)
    else if (cue.state === 'inserted' || cue.state === 'inserting')
      destination.copy(filler)
    else if (cue.state === 'returning') destination.copy(rack)
    else destination.copy(start)

    nozzle.current.position.copy(destination)
    nozzle.current.rotation.set(
      0,
      cue.state === 'inserted' ? 0 : cue.pump === 'self' ? -0.18 : 0.18,
      cue.state === 'inserted' ? 0 : -0.3,
    )
  })

  return (
    <>
      <group ref={nozzle} visible={worldVisible}>
        <RoundedBox
          args={[0.11, 0.16, 0.28]}
          radius={0.022}
          smoothness={3}
          position={[0.22, 0, 0]}
          castShadow
        >
          <meshStandardMaterial color="#20252b" metalness={0.2} roughness={0.48} />
        </RoundedBox>
        <mesh position={[0.08, 0.07, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.014, 0.02, 0.3, 12]} />
          <meshStandardMaterial color="#c7cbd0" metalness={0.72} roughness={0.28} />
        </mesh>
      </group>
      <mesh
        geometry={hoseGeometry}
        visible={Boolean(cue && cue.state !== 'holstered')}
        castShadow
      >
        <meshStandardMaterial color="#101317" roughness={0.9} />
      </mesh>
    </>
  )
}
