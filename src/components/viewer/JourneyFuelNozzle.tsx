import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getJourney } from '@/domain/journeys'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useStationRuntimeStore } from '@/stores/stationRuntimeStore'
import { useViewerStore } from '@/stores/viewerStore'
import { FuelNozzleModel } from './FuelNozzleModel'

function belongsToPump(object: THREE.Object3D, pumpName: string) {
  let current: THREE.Object3D | null = object
  while (current) {
    if (current.name === pumpName) return true
    current = current.parent
  }
  return false
}

function isHeld(state?: string) {
  return Boolean(state && state !== 'holstered' && state !== 'returning')
}

/**
 * First-person nozzle view-model. Pickup is communicated with a clean cut:
 * after the rack disappears the nozzle is already held at a stable, readable
 * distance from the camera. It never flies through space or detaches from the
 * hand during the prototype journey.
 */
export function JourneyFuelNozzle() {
  const mode = useViewerStore((state) => state.navigationMode)
  const routeId = usePlaybackStore((state) => state.activeRouteId)
  const activeStepIndex = usePlaybackStore((state) => state.activeStepIndex)
  const root = useStationRuntimeStore((state) => state.root)
  const { camera } = useThree()
  const viewModel = useRef<THREE.Group>(null)
  const forward = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const up = useMemo(() => new THREE.Vector3(), [])
  const localRotation = useMemo(
    () =>
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(-0.2, -0.28, 0.32, 'XYZ'),
      ),
    [],
  )
  const journey = getJourney(routeId)
  const step = journey.steps[activeStepIndex]
  const cue = mode === 'auto' ? step?.nozzle : undefined
  const held = isHeld(cue?.state)
  const driverVisible =
    held && cue?.owner === 'driver' && step?.cameraMode === 'pedestrian'

  useFrame(() => {
    if (!viewModel.current || !driverVisible) return
    forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
    right.set(1, 0, 0).applyQuaternion(camera.quaternion)
    up.set(0, 1, 0).applyQuaternion(camera.quaternion)
    viewModel.current.position
      .copy(camera.position)
      .addScaledVector(forward, 0.68)
      .addScaledVector(right, 0.3)
      .addScaledVector(up, -0.31)
    viewModel.current.quaternion.copy(camera.quaternion).multiply(localRotation)
  })

  useEffect(() => {
    if (!root) return
    const pumpName =
      cue?.pump === 'servito' ? 'fuel-dispenser-21' : 'fuel-dispenser-11'
    root.traverse((object) => {
      if (object.name !== 'q8-easy-nozzle-0') return
      object.visible = !held || !belongsToPump(object, pumpName)
    })
    return () => {
      root.traverse((object) => {
        if (object.name === 'q8-easy-nozzle-0') object.visible = true
      })
    }
  }, [cue?.pump, held, root])

  return (
    <group ref={viewModel} visible={driverVisible} renderOrder={8}>
      <FuelNozzleModel scale={0.78} />
    </group>
  )
}
