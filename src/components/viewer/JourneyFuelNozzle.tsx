import { RoundedBox } from '@react-three/drei'
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
  const nozzle = useRef<THREE.Group>(null)
  const journey = getJourney(routeId)
  const step = journey.steps[activeStepIndex]
  const cue = mode === 'auto' ? step?.nozzle : undefined
  const rack = cue ? RACK[cue.pump] : RACK.self
  const filler = cue ? FILLER[cue.pump] : FILLER.self
  // Presentation-safe preview: the procedural prop is shown only in its final,
  // stable pose. Pickup and insertion are implied by short cuts, so the user
  // never sees a low-poly nozzle flying, detaching from a hand or intersecting
  // the bodywork. Production GLTF animation can replace this cue later.
  const worldVisible = cue?.state === 'inserted'

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
    const pumpName =
      cue?.pump === 'servito' ? 'fuel-dispenser-21' : 'fuel-dispenser-11'
    root.traverse((object) => {
      if (object.name !== 'q8-easy-nozzle-0') return
      object.visible = !worldVisible || !belongsToPump(object, pumpName)
    })
    return () => {
      root.traverse((object) => {
        if (object.name === 'q8-easy-nozzle-0') object.visible = true
      })
    }
  }, [cue, root, worldVisible])

  return (
    <>
      <group
        ref={nozzle}
        visible={worldVisible}
        position={filler}
        rotation={[0, cue?.pump === 'self' ? -0.08 : 0.08, -0.08]}
      >
        <RoundedBox
          args={[0.11, 0.16, 0.28]}
          radius={0.022}
          smoothness={3}
          position={[0.22, 0, 0]}
          castShadow
        >
          <meshStandardMaterial
            color="#20252b"
            metalness={0.2}
            roughness={0.48}
          />
        </RoundedBox>
        <mesh position={[0.08, 0.07, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.014, 0.02, 0.3, 12]} />
          <meshStandardMaterial
            color="#c7cbd0"
            metalness={0.72}
            roughness={0.28}
          />
        </mesh>
      </group>
      <mesh geometry={hoseGeometry} visible={worldVisible} castShadow>
        <meshStandardMaterial color="#101317" roughness={0.9} />
      </mesh>
    </>
  )
}
