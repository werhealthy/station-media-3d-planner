/* eslint-disable react-hooks/immutability -- R3F camera/control objects are mutable scene graph state. */
import { OrbitControls, PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { HOTSPOTS } from '@/domain/hotspots'
import { useViewerStore } from '@/stores/viewerStore'
import { usePlaybackStore } from '@/stores/playbackStore'
import {
  WALKTHROUGH_DURATION,
  WALKTHROUGH_ROUTE,
} from '@/domain/walkthroughRoute'

const OVERVIEW_POSITION = new THREE.Vector3(31, 19, 34)
const OVERVIEW_TARGET = new THREE.Vector3(1, 2, -2)
const EYE_HEIGHT = 1.7
const WALK_SPEED = 2.35
const CAPSULE_RADIUS = 0.34
const GRAVITY = 18

const COLLIDERS = [
  { minX: 3.2, maxX: 22.8, minZ: -14.4, maxZ: -5.3 },
  { minX: -23.9, maxX: -20.1, minZ: -10.9, maxZ: -9.1 },
  ...[-8, -4, 0, 4, 8].flatMap((x) =>
    [2.8, -3.2].map((z) => ({
      minX: x - 1.1,
      maxX: x + 1.1,
      minZ: z - 0.85,
      maxZ: z + 0.85,
    })),
  ),
  ...[-7, 7].map((x) => ({
    minX: x - 0.75,
    maxX: x + 0.75,
    minZ: -0.65,
    maxZ: 0.65,
  })),
]

function canWalkTo(position: THREE.Vector3) {
  return !COLLIDERS.some(
    (box) =>
      position.x < box.maxX + CAPSULE_RADIUS &&
      position.x > box.minX - CAPSULE_RADIUS &&
      position.z > box.minZ - CAPSULE_RADIUS &&
      position.z < box.maxZ + CAPSULE_RADIUS,
  )
}

export function NavigationRig() {
  const mode = useViewerStore((s) => s.navigationMode)
  const activeHotspotId = useViewerStore((s) => s.activeHotspotId)
  const setMode = useViewerStore((s) => s.setNavigationMode)
  const overviewUnlocked = useViewerStore((s) => s.overviewUnlocked)
  const { camera, gl } = useThree()
  const perspectiveCamera = camera as THREE.PerspectiveCamera
  const orbit = useRef<OrbitControlsImpl>(null)
  const keys = useRef(new Set<string>())
  const destination = useMemo(() => new THREE.Vector3(), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const velocity = useRef(new THREE.Vector3())
  const walkTime = useRef(0)
  const verticalVelocity = useRef(0)
  const autoTime = useRef(0)
  const lastUiUpdate = useRef(0)
  const isPlaying = usePlaybackStore((s) => s.isPlaying)
  const playbackSpeed = usePlaybackStore((s) => s.playbackSpeed)
  const setProgress = usePlaybackStore((s) => s.setProgress)
  const setActiveStep = usePlaybackStore((s) => s.setActiveStep)
  const pause = usePlaybackStore((s) => s.pause)
  const seekToken = usePlaybackStore((s) => s.seekToken)

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current.add(event.code)
      if (event.code === 'Escape' && mode === 'walkthrough') setMode('overview')
    }
    const up = (event: KeyboardEvent) => keys.current.delete(event.code)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [mode, setMode])

  useEffect(() => {
    if (mode === 'walkthrough') {
      camera.position.set(-15, EYE_HEIGHT, 13)
      camera.lookAt(0, EYE_HEIGHT, 0)
      perspectiveCamera.fov = 58
      perspectiveCamera.updateProjectionMatrix()
      velocity.current.set(0, 0, 0)
      verticalVelocity.current = 0
      walkTime.current = 0
    }
  }, [camera, mode, perspectiveCamera])

  useEffect(() => {
    if (mode !== 'auto') return
    autoTime.current =
      usePlaybackStore.getState().progress * WALKTHROUGH_DURATION
    perspectiveCamera.fov = 56
    perspectiveCamera.updateProjectionMatrix()
  }, [mode, perspectiveCamera])

  useEffect(() => {
    if (mode === 'auto')
      autoTime.current =
        usePlaybackStore.getState().progress * WALKTHROUGH_DURATION
  }, [mode, seekToken])

  useFrame((_, delta) => {
    if (mode === 'walkthrough') {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
        camera.quaternion,
      )
      forward.y = 0
      forward.normalize()
      const right = new THREE.Vector3()
        .crossVectors(forward, camera.up)
        .normalize()
      const move = new THREE.Vector3()
      if (keys.current.has('KeyW') || keys.current.has('ArrowUp'))
        move.add(forward)
      if (keys.current.has('KeyS') || keys.current.has('ArrowDown'))
        move.sub(forward)
      if (keys.current.has('KeyD') || keys.current.has('ArrowRight'))
        move.add(right)
      if (keys.current.has('KeyA') || keys.current.has('ArrowLeft'))
        move.sub(right)
      const desiredVelocity = move.lengthSq()
        ? move.normalize().multiplyScalar(WALK_SPEED)
        : move
      velocity.current.lerp(
        desiredVelocity,
        1 - Math.exp(-delta * (move.lengthSq() ? 7 : 9)),
      )
      if (velocity.current.lengthSq() > 0.002) {
        const next = camera.position
          .clone()
          .addScaledVector(velocity.current, delta)
        next.x = THREE.MathUtils.clamp(next.x, -29, 29)
        next.z = THREE.MathUtils.clamp(next.z, -20, 20)
        // Resolve the capsule independently on each horizontal axis so the
        // pedestrian naturally slides along walls instead of abruptly stopping.
        const nextX = camera.position.clone()
        nextX.x = next.x
        const nextZ = camera.position.clone()
        nextZ.z = next.z
        if (canWalkTo(nextX)) camera.position.x = nextX.x
        else velocity.current.x = 0
        if (canWalkTo(nextZ)) camera.position.z = nextZ.z
        else velocity.current.z = 0
        walkTime.current += delta * velocity.current.length() * 2.2
      }
      verticalVelocity.current -= GRAVITY * delta
      const groundedHeight = EYE_HEIGHT
      camera.position.y = Math.max(
        groundedHeight,
        camera.position.y + verticalVelocity.current * delta,
      )
      if (camera.position.y <= groundedHeight) verticalVelocity.current = 0
      const bob = Math.sin(walkTime.current * Math.PI) * 0.014
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        EYE_HEIGHT + bob,
        1 - Math.exp(-delta * 12),
      )
      return
    }

    if (mode === 'auto') {
      if (isPlaying)
        autoTime.current = Math.min(
          WALKTHROUGH_DURATION,
          autoTime.current + delta * playbackSpeed,
        )
      let elapsed = 0
      let stepIndex = WALKTHROUGH_ROUTE.length - 1
      for (let index = 0; index < WALKTHROUGH_ROUTE.length; index += 1) {
        if (autoTime.current <= elapsed + WALKTHROUGH_ROUTE[index]!.duration) {
          stepIndex = index
          break
        }
        elapsed += WALKTHROUGH_ROUTE[index]!.duration
      }
      const current = WALKTHROUGH_ROUTE[stepIndex]!
      const previous = WALKTHROUGH_ROUTE[Math.max(0, stepIndex - 1)]!
      const local = THREE.MathUtils.clamp(
        (autoTime.current - elapsed) / current.duration,
        0,
        1,
      )
      const smooth = THREE.MathUtils.smootherstep(local, 0, 1)
      destination
        .set(...previous.position)
        .lerp(new THREE.Vector3(...current.position), smooth)
      target
        .set(...previous.gazeTarget)
        .lerp(new THREE.Vector3(...current.gazeTarget), smooth)
      camera.position.lerp(destination, 1 - Math.exp(-delta * 7))
      camera.lookAt(target)
      if (autoTime.current - lastUiUpdate.current > 0.12 || !isPlaying) {
        lastUiUpdate.current = autoTime.current
        setProgress(autoTime.current / WALKTHROUGH_DURATION)
        setActiveStep(stepIndex, current.mediaPointId ?? null)
      }
      if (autoTime.current >= WALKTHROUGH_DURATION && isPlaying) pause()
      return
    }

    if (mode === 'overview' && overviewUnlocked) return

    const hotspot = HOTSPOTS.find((item) => item.id === activeHotspotId)
    if (hotspot) {
      destination.set(...hotspot.position)
      target.set(...hotspot.target)
    } else {
      destination.copy(OVERVIEW_POSITION)
      target.copy(OVERVIEW_TARGET)
    }
    camera.position.lerp(destination, 1 - Math.exp(-delta * 3.8))
    if (orbit.current)
      orbit.current.target.lerp(target, 1 - Math.exp(-delta * 4.5))
    const desiredFov = hotspot?.fov ?? 42
    perspectiveCamera.fov = THREE.MathUtils.lerp(
      perspectiveCamera.fov,
      desiredFov,
      1 - Math.exp(-delta * 4),
    )
    perspectiveCamera.updateProjectionMatrix()
    orbit.current?.update()
  })

  if (mode === 'walkthrough') {
    return <PointerLockControls makeDefault domElement={gl.domElement} />
  }
  return (
    <OrbitControls
      ref={orbit}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.55}
      zoomSpeed={0.7}
      enabled={mode === 'overview' && overviewUnlocked}
      minDistance={20}
      maxDistance={52}
      minPolarAngle={Math.PI * 0.19}
      maxPolarAngle={Math.PI * 0.455}
    />
  )
}
