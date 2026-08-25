/* eslint-disable react-hooks/immutability -- R3F camera/control objects are mutable scene graph state. */
import { OrbitControls, PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useViewerStore } from '@/stores/viewerStore'
import { usePlaybackStore } from '@/stores/playbackStore'
import { getJourney, journeyDuration } from '@/domain/journeys'
import { useStationRuntimeStore } from '@/stores/stationRuntimeStore'
import { useStationSetupStore } from '@/stores/stationSetupStore'
import { orbitMinDistance } from './navigationLimits'

const OVERVIEW_POSITION = new THREE.Vector3(30, 16, 31)
const OVERVIEW_TARGET = new THREE.Vector3(0, 2.2, -2)
const WALK_SPEED = 2.35
const CAPSULE_RADIUS = 0.34
const GRAVITY = 18

const COLLIDERS = [
  { minX: 3.2, maxX: 22.8, minZ: -14.4, maxZ: -5.3 },
  { minX: -23.9, maxX: -20.1, minZ: -10.9, maxZ: -9.1 },
  ...[-5, 5].flatMap((x) =>
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
  const eyeHeight = useViewerStore((s) => s.eyeHeight)
  const selectedMediaPointId = useViewerStore((s) => s.selectedMediaPointId)
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
  const activeRouteId = usePlaybackStore((s) => s.activeRouteId)
  const activeJourney = useMemo(
    () => getJourney(activeRouteId),
    [activeRouteId],
  )
  const activeJourneyDuration = useMemo(
    () => journeyDuration(activeJourney),
    [activeJourney],
  )
  const runtimeBounds = useStationRuntimeStore((s) => s.bounds)
  const config = useStationSetupStore((s) => s.config)
  const setupEnabled = useStationSetupStore((s) => s.enabled)
  const setCurrentView = useStationSetupStore((s) => s.setCurrentView)
  const requestedView = useStationSetupStore((s) => s.requestedView)
  const viewRequestId = useStationSetupStore((s) => s.viewRequestId)
  const modelFrame = useMemo(() => {
    if (!runtimeBounds) return null
    const center = new THREE.Vector3(...runtimeBounds.center)
    const size = new THREE.Vector3(...runtimeBounds.size)
    const radius = Math.max(size.x, size.z, size.y * 1.4) * 0.62
    const target = center.clone()
    target.y = runtimeBounds.min[1] + size.y * 0.35
    const position = target
      .clone()
      .add(new THREE.Vector3(radius * 0.9, radius * 0.58, radius * 1.05))
    return { center, size, radius, target, position }
  }, [runtimeBounds])

  useEffect(() => {
    if (!requestedView || !viewRequestId) return
    camera.position.set(...requestedView.position)
    perspectiveCamera.fov = requestedView.fov
    perspectiveCamera.zoom = requestedView.zoom ?? 1
    perspectiveCamera.updateProjectionMatrix()
    if (orbit.current) {
      orbit.current.target.set(...requestedView.target)
      orbit.current.update()
    } else camera.lookAt(...requestedView.target)
  }, [camera, perspectiveCamera, requestedView, viewRequestId])

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
      if (config.modelType === 'procedural') {
        camera.position.set(-18.5, eyeHeight, 14)
        camera.lookAt(0, eyeHeight, -1.5)
      } else if (runtimeBounds) {
        const padding = Math.max(
          2,
          Math.min(runtimeBounds.size[0], runtimeBounds.size[2]) * 0.08,
        )
        camera.position.set(
          runtimeBounds.min[0] - padding,
          runtimeBounds.min[1] + eyeHeight,
          runtimeBounds.max[2] + padding,
        )
        camera.lookAt(
          runtimeBounds.center[0],
          camera.position.y,
          runtimeBounds.center[2],
        )
      } else {
        camera.position.set(-15, eyeHeight, 13)
        camera.lookAt(0, eyeHeight, 0)
      }
      perspectiveCamera.fov = 58
      perspectiveCamera.updateProjectionMatrix()
      velocity.current.set(0, 0, 0)
      verticalVelocity.current = 0
      walkTime.current = 0
    }
  }, [
    camera,
    config.modelType,
    eyeHeight,
    mode,
    perspectiveCamera,
    runtimeBounds,
  ])

  useEffect(() => {
    if (mode !== 'auto') return
    autoTime.current =
      usePlaybackStore.getState().progress *
      (config.modelType === 'procedural'
        ? activeJourneyDuration
        : config.walkPath.length * 4)
    perspectiveCamera.fov = 56
    perspectiveCamera.updateProjectionMatrix()
    if (config.modelType === 'procedural') {
      const start = activeJourney.steps[0]
      if (start) {
        camera.position.set(...start.position)
        camera.lookAt(...start.gazeTarget)
      }
    }
  }, [
    activeJourney.steps,
    activeJourneyDuration,
    camera,
    config.modelType,
    config.walkPath.length,
    mode,
    perspectiveCamera,
  ])

  useEffect(() => {
    if (mode === 'auto')
      autoTime.current =
        usePlaybackStore.getState().progress *
        (config.modelType === 'procedural'
          ? activeJourneyDuration
          : config.walkPath.length * 4)
  }, [
    activeJourneyDuration,
    config.modelType,
    config.walkPath.length,
    mode,
    seekToken,
  ])

  useFrame((_, delta) => {
    if (setupEnabled) {
      const orbitTarget =
        orbit.current?.target ??
        new THREE.Vector3(0, 0, -1)
          .applyQuaternion(camera.quaternion)
          .add(camera.position)
      setCurrentView({
        position: camera.position.toArray(),
        target: orbitTarget.toArray(),
        fov: perspectiveCamera.fov,
        zoom: perspectiveCamera.zoom,
      })
    }
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
        const walkMinX = runtimeBounds ? runtimeBounds.min[0] - 4 : -29
        const walkMaxX = runtimeBounds ? runtimeBounds.max[0] + 4 : 29
        const walkMinZ = runtimeBounds ? runtimeBounds.min[2] - 4 : -20
        const walkMaxZ = runtimeBounds ? runtimeBounds.max[2] + 4 : 20
        next.x = THREE.MathUtils.clamp(next.x, walkMinX, walkMaxX)
        next.z = THREE.MathUtils.clamp(next.z, walkMinZ, walkMaxZ)
        // Resolve the capsule independently on each horizontal axis so the
        // pedestrian naturally slides along walls instead of abruptly stopping.
        const nextX = camera.position.clone()
        nextX.x = next.x
        const nextZ = camera.position.clone()
        nextZ.z = next.z
        if (
          useStationRuntimeStore.getState().diagnostics?.source ===
            'external-fbx' ||
          canWalkTo(nextX)
        )
          camera.position.x = nextX.x
        else velocity.current.x = 0
        if (
          useStationRuntimeStore.getState().diagnostics?.source ===
            'external-fbx' ||
          canWalkTo(nextZ)
        )
          camera.position.z = nextZ.z
        else velocity.current.z = 0
        walkTime.current += delta * velocity.current.length() * 4.8
      }
      verticalVelocity.current -= GRAVITY * delta
      const groundedHeight =
        (config.ground?.y ?? (runtimeBounds ? runtimeBounds.min[1] : 0)) +
        eyeHeight
      camera.position.y = Math.max(
        groundedHeight,
        camera.position.y + verticalVelocity.current * delta,
      )
      if (camera.position.y <= groundedHeight) verticalVelocity.current = 0
      const bob = Math.sin(walkTime.current) * 0.026
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        groundedHeight + bob,
        1 - Math.exp(-delta * 12),
      )
      return
    }

    if (mode === 'auto') {
      if (config.modelType !== 'procedural') {
        if (config.walkPath.length < 2) {
          setProgress(0)
          pause()
          return
        }
        if (isPlaying)
          autoTime.current = Math.min(
            config.walkPath.length * 4,
            autoTime.current + delta * playbackSpeed,
          )
        const duration = config.walkPath.length * 4
        const progress = THREE.MathUtils.clamp(
          autoTime.current / duration,
          0,
          1,
        )
        const curve = new THREE.CatmullRomCurve3(
          config.walkPath.map((point) => new THREE.Vector3(...point.position)),
          false,
          'centripetal',
        )
        destination.copy(curve.getPoint(progress))
        destination.y += eyeHeight
        const pointIndex = Math.min(
          config.walkPath.length - 1,
          Math.round(progress * (config.walkPath.length - 1)),
        )
        const point = config.walkPath[pointIndex]!
        if (point.lookAt) target.set(...point.lookAt)
        else
          target
            .copy(curve.getPoint(Math.min(1, progress + 0.02)))
            .setY(destination.y)
        camera.position.lerp(destination, 1 - Math.exp(-delta * 7))
        camera.lookAt(target)
        setProgress(progress)
        setActiveStep(pointIndex, point.lookAtMediaPointId ?? null)
        if (progress >= 1 && isPlaying) pause()
        return
      }
      if (isPlaying)
        autoTime.current = Math.min(
          activeJourneyDuration,
          autoTime.current + delta * playbackSpeed,
        )
      let elapsed = 0
      let stepIndex = activeJourney.steps.length - 1
      for (let index = 0; index < activeJourney.steps.length; index += 1) {
        if (
          autoTime.current <=
          elapsed + activeJourney.steps[index]!.duration
        ) {
          stepIndex = index
          break
        }
        elapsed += activeJourney.steps[index]!.duration
      }
      const current = activeJourney.steps[stepIndex]!
      const previous = activeJourney.steps[Math.max(0, stepIndex - 1)]!
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
        setProgress(autoTime.current / activeJourneyDuration)
        setActiveStep(stepIndex, current.mediaPointId ?? null)
      }
      if (autoTime.current >= activeJourneyDuration && isPlaying) pause()
      return
    }

    if (mode === 'overview' && overviewUnlocked) return

    const focusPoint = config.mediaPoints.find(
      (item) => item.id === selectedMediaPointId,
    )
    const hotspot = config.hotspots.find((item) => item.id === activeHotspotId)
    const isFocusing = mode === 'overview' && Boolean(focusPoint)
    if (isFocusing && focusPoint) {
      target.set(...focusPoint.position)
      const rotation = new THREE.Euler(
        THREE.MathUtils.degToRad(focusPoint.rotation[0]),
        THREE.MathUtils.degToRad(focusPoint.rotation[1]),
        THREE.MathUtils.degToRad(focusPoint.rotation[2]),
      )
      const front = new THREE.Vector3(0, 0, 1).applyEuler(rotation).normalize()
      const distance = Math.max(
        2.2,
        Math.max(focusPoint.width, focusPoint.height) * 1.65,
      )
      destination
        .copy(target)
        .addScaledVector(front, distance)
        .add(new THREE.Vector3(0, Math.max(0.35, focusPoint.height * 0.18), 0))
    } else if (hotspot) {
      destination.set(...hotspot.position)
      target.set(...hotspot.target)
    } else {
      destination.copy(
        config.overviewCamera
          ? new THREE.Vector3(...config.overviewCamera.position)
          : modelFrame
            ? modelFrame.position
            : OVERVIEW_POSITION,
      )
      target.copy(
        config.overviewCamera
          ? new THREE.Vector3(...config.overviewCamera.target)
          : modelFrame
            ? modelFrame.target
            : OVERVIEW_TARGET,
      )
    }
    camera.position.lerp(destination, 1 - Math.exp(-delta * 3.8))
    if (orbit.current)
      orbit.current.target.lerp(target, 1 - Math.exp(-delta * 4.5))
    const desiredFov = isFocusing
      ? 38
      : (hotspot?.fov ?? config.overviewCamera?.fov ?? 42)
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
      enablePan={setupEnabled}
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.55}
      zoomSpeed={0.7}
      enabled={mode === 'overview' && (overviewUnlocked || setupEnabled)}
      maxDistance={modelFrame ? modelFrame.radius * 3 : 52}
      minDistance={orbitMinDistance(setupEnabled, modelFrame?.radius)}
      minPolarAngle={Math.PI * 0.19}
      maxPolarAngle={Math.PI * 0.455}
    />
  )
}
