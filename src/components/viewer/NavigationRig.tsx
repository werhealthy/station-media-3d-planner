/* eslint-disable react-hooks/immutability -- R3F camera/control objects are mutable scene graph state. */
import { OrbitControls, PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { eyeHeightFromPersonHeight, useViewerStore } from '@/stores/viewerStore'
import { usePlaybackStore } from '@/stores/playbackStore'
import {
  getJourney,
  journeyDuration,
  type JourneyMotion,
} from '@/domain/journeys'
import {
  createArrivalCurve,
  pedestrianCollisionAt,
  vehicleCollisionAt,
  vehicleYawFromTangent,
} from '@/domain/journeySafety'
import { useStationRuntimeStore } from '@/stores/stationRuntimeStore'
import { useStationSetupStore } from '@/stores/stationSetupStore'
import { orbitMinDistance } from './navigationLimits'

const OVERVIEW_POSITION = new THREE.Vector3(30, 16, 31)
const OVERVIEW_TARGET = new THREE.Vector3(0, 2.2, -2)
const WALK_SPEED = 1.68
const GRAVITY = 18

function canWalkTo(position: THREE.Vector3) {
  return !pedestrianCollisionAt(position)
}

function easeJourneyMotion(local: number, motion: JourneyMotion) {
  switch (motion) {
    case 'drive':
      return 1 - Math.pow(1 - local, 1.55)
    case 'brake':
      return 1 - Math.pow(1 - local, 2.7)
    case 'exit':
      return THREE.MathUtils.clamp(local * 1.18, 0, 1)
    case 'enter':
      return THREE.MathUtils.smoothstep(local, 0, 1)
    case 'glance':
      return THREE.MathUtils.smootherstep(local, 0, 1)
    case 'hold':
      return THREE.MathUtils.smootherstep(local, 0, 1)
    case 'walk':
    default:
      return local
  }
}

export function NavigationRig() {
  const mode = useViewerStore((s) => s.navigationMode)
  const activeHotspotId = useViewerStore((s) => s.activeHotspotId)
  const setMode = useViewerStore((s) => s.setNavigationMode)
  const overviewUnlocked = useViewerStore((s) => s.overviewUnlocked)
  const personHeight = useViewerStore((s) => s.personHeight)
  const eyeHeight = eyeHeightFromPersonHeight(personHeight)
  const selectedMediaPointId = useViewerStore((s) => s.selectedMediaPointId)
  const { camera, gl } = useThree()
  const perspectiveCamera = camera as THREE.PerspectiveCamera
  const orbit = useRef<OrbitControlsImpl>(null)
  const keys = useRef(new Set<string>())
  const destination = useMemo(() => new THREE.Vector3(), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const authoredGaze = useMemo(() => new THREE.Vector3(), [])
  const gazeDirection = useMemo(() => new THREE.Vector3(), [])
  const flatTangent = useMemo(() => new THREE.Vector3(), [])
  const smoothedAutoTarget = useRef(new THREE.Vector3())
  const velocity = useRef(new THREE.Vector3())
  const walkTime = useRef(0)
  const verticalVelocity = useRef(0)
  const personHeightRef = useRef(personHeight)
  const walkthroughInitialized = useRef(false)
  const autoTime = useRef(0)
  const lastUiUpdate = useRef(0)
  const lastSafeAutoPosition = useRef(new THREE.Vector3())
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
  const arrivalCurve = useMemo(
    () => createArrivalCurve(activeJourney.arrivalPath),
    [activeJourney],
  )
  const arrivalEndIndex = useMemo(
    () =>
      activeJourney.steps.findIndex(
        (step) => step.id === activeJourney.arrivalEndStepId,
      ),
    [activeJourney],
  )
  const arrivalDuration = useMemo(
    () =>
      activeJourney.steps
        .slice(0, arrivalEndIndex + 1)
        .reduce((total, step) => total + step.duration, 0),
    [activeJourney, arrivalEndIndex],
  )
  const departureCurve = useMemo(
    () => createArrivalCurve(activeJourney.departurePath),
    [activeJourney],
  )
  const departureStartIndex = useMemo(
    () =>
      activeJourney.steps.findIndex(
        (step) => step.id === activeJourney.departureStartStepId,
      ),
    [activeJourney],
  )
  const departureStartTime = useMemo(
    () =>
      activeJourney.steps
        .slice(0, Math.max(0, departureStartIndex))
        .reduce((total, step) => total + step.duration, 0),
    [activeJourney, departureStartIndex],
  )
  const departureDuration = activeJourneyDuration - departureStartTime
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
    personHeightRef.current = personHeight
  }, [personHeight])

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
    if (mode !== 'walkthrough') {
      walkthroughInitialized.current = false
      return
    }
    if (!walkthroughInitialized.current) {
      walkthroughInitialized.current = true
      const initialEyeHeight = eyeHeightFromPersonHeight(
        personHeightRef.current,
      )
      if (config.modelType === 'procedural') {
        camera.position.set(-18.5, initialEyeHeight, 14)
        camera.lookAt(0, initialEyeHeight, -1.5)
      } else if (runtimeBounds) {
        const padding = Math.max(
          2,
          Math.min(runtimeBounds.size[0], runtimeBounds.size[2]) * 0.08,
        )
        camera.position.set(
          runtimeBounds.min[0] - padding,
          runtimeBounds.min[1] + initialEyeHeight,
          runtimeBounds.max[2] + padding,
        )
        camera.lookAt(
          runtimeBounds.center[0],
          camera.position.y,
          runtimeBounds.center[2],
        )
      } else {
        camera.position.set(-15, initialEyeHeight, 13)
        camera.lookAt(0, initialEyeHeight, 0)
      }
      perspectiveCamera.fov = 64
      perspectiveCamera.updateProjectionMatrix()
      velocity.current.set(0, 0, 0)
      verticalVelocity.current = 0
      walkTime.current = 0
    }
  }, [camera, config.modelType, mode, perspectiveCamera, runtimeBounds])

  useEffect(() => {
    if (mode !== 'auto') return
    autoTime.current =
      usePlaybackStore.getState().progress *
      (config.modelType === 'procedural'
        ? activeJourneyDuration
        : config.walkPath.length * 4)
    perspectiveCamera.fov = 68
    perspectiveCamera.updateProjectionMatrix()
    lastUiUpdate.current = 0
    if (config.modelType === 'procedural') {
      const currentProgress = usePlaybackStore.getState().progress
      const routeTime = currentProgress * activeJourneyDuration
      const initialStep = activeJourney.steps.find((_, index) => {
        const elapsed = activeJourney.steps
          .slice(0, index + 1)
          .reduce((total, item) => total + item.duration, 0)
        return routeTime <= elapsed
      })
      const start =
        routeTime <= arrivalDuration
          ? arrivalCurve.getPointAt(
              THREE.MathUtils.smoothstep(
                THREE.MathUtils.clamp(
                  routeTime / Math.max(arrivalDuration, 0.001),
                  0,
                  1,
                ),
                0,
                1,
              ),
            )
          : new THREE.Vector3(...(initialStep?.position ?? [0, 1.28, 0]))
      if (initialStep) {
        camera.position.copy(start)
        lastSafeAutoPosition.current.copy(camera.position)
        smoothedAutoTarget.current.set(...initialStep.gazeTarget)
        camera.lookAt(...initialStep.gazeTarget)
      }
    }
  }, [
    activeJourney,
    activeJourneyDuration,
    arrivalCurve,
    arrivalDuration,
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
      const stride = Math.sin(walkTime.current)
      const bob = Math.abs(stride) * 0.012 - 0.006
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
      const inContinuousArrival =
        arrivalEndIndex >= 0 && stepIndex <= arrivalEndIndex
      const inContinuousDeparture =
        departureStartIndex >= 0 && stepIndex >= departureStartIndex

      if (inContinuousArrival) {
        const rawArrivalProgress = THREE.MathUtils.clamp(
          autoTime.current / Math.max(arrivalDuration, 0.001),
          0,
          1,
        )
        // A single acceleration/deceleration envelope: no easing reset and no
        // artificial stop at the intermediate narrative labels.
        const arrivalProgress = THREE.MathUtils.smoothstep(
          rawArrivalProgress,
          0,
          1,
        )
        const candidate = arrivalCurve.getPointAt(arrivalProgress)
        const tangent = arrivalCurve.getTangentAt(arrivalProgress).normalize()
        const yaw = vehicleYawFromTangent(tangent)
        if (!vehicleCollisionAt(candidate, yaw)) {
          lastSafeAutoPosition.current.copy(candidate)
        }
        destination.copy(lastSafeAutoPosition.current)
        target.copy(destination).addScaledVector(tangent, 9).setY(1.3)
        if (current.mediaPointId) {
          authoredGaze.set(...current.gazeTarget)
          gazeDirection.copy(authoredGaze).sub(destination).setY(0)
          flatTangent.copy(tangent).setY(0).normalize()
          if (
            gazeDirection.lengthSq() > 0.001 &&
            gazeDirection.normalize().dot(flatTangent) > 0.18
          ) {
            const angle = flatTangent.angleTo(gazeDirection)
            const blend = Math.min(
              0.72,
              THREE.MathUtils.degToRad(34) / Math.max(angle, 0.001),
            )
            gazeDirection.lerp(flatTangent, 1 - blend).normalize()
            target.copy(destination).addScaledVector(gazeDirection, 9)
            target.y = THREE.MathUtils.lerp(1.3, authoredGaze.y, 0.55)
          }
        }
      } else if (inContinuousDeparture) {
        const rawDepartureProgress = THREE.MathUtils.clamp(
          (autoTime.current - departureStartTime) /
            Math.max(departureDuration, 0.001),
          0,
          1,
        )
        const departureProgress = THREE.MathUtils.smoothstep(
          rawDepartureProgress,
          0,
          1,
        )
        const candidate = departureCurve.getPointAt(departureProgress)
        const tangent = departureCurve
          .getTangentAt(departureProgress)
          .normalize()
        const yaw = vehicleYawFromTangent(tangent)
        if (!vehicleCollisionAt(candidate, yaw))
          lastSafeAutoPosition.current.copy(candidate)
        destination.copy(lastSafeAutoPosition.current)
        target.copy(destination).addScaledVector(tangent, 10).setY(1.3)
      } else {
        const motionAmount = easeJourneyMotion(local, current.motion)
        const gazeAmount =
          current.motion === 'walk'
            ? THREE.MathUtils.clamp(local * 1.4, 0, 1)
            : easeJourneyMotion(local, current.motion)
        destination
          .set(...previous.position)
          .lerp(new THREE.Vector3(...current.position), motionAmount)
        const startY =
          previous.cameraMode === 'pedestrian'
            ? eyeHeight
            : previous.position[1]
        const endY =
          current.cameraMode === 'pedestrian' ? eyeHeight : current.position[1]
        destination.y = THREE.MathUtils.lerp(startY, endY, motionAmount)
        target
          .set(...previous.gazeTarget)
          .lerp(new THREE.Vector3(...current.gazeTarget), gazeAmount)

        if (current.motion === 'walk') {
          const walkingDirection = new THREE.Vector3(...current.position).sub(
            new THREE.Vector3(...previous.position),
          )
          walkingDirection.y = 0
          if (walkingDirection.lengthSq() > 0.001)
            target
              .copy(destination)
              .addScaledVector(walkingDirection.normalize(), 4.5)
              .setY(destination.y - 0.08)
        }

        if (current.cameraMode === 'pedestrian') {
          if (pedestrianCollisionAt(destination))
            destination.copy(lastSafeAutoPosition.current)
          else lastSafeAutoPosition.current.copy(destination)
        } else lastSafeAutoPosition.current.copy(destination)
      }

      if (current.motion === 'walk') {
        const footfalls = local * Math.max(2, current.duration * 1.9) * Math.PI
        destination.y += Math.abs(Math.sin(footfalls)) * 0.017 - 0.006
        target.x += Math.sin(footfalls * 0.5) * 0.025
      } else if (current.motion === 'drive' || current.motion === 'brake') {
        destination.y += Math.sin(autoTime.current * 17) * 0.0025
      } else if (current.motion === 'hold') {
        destination.y += Math.sin(autoTime.current * 1.8) * 0.004
        target.x += Math.sin(autoTime.current * 2.15) * 0.026
      }

      camera.position.copy(destination)
      smoothedAutoTarget.current.lerp(
        target,
        1 -
          Math.exp(
            -delta *
              (inContinuousArrival || inContinuousDeparture
                ? 3.4
                : current.motion === 'walk'
                  ? 3.2
                  : current.motion === 'glance'
                    ? 1.15
                    : current.motion === 'hold'
                      ? 1.7
                      : 3.1),
          ),
      )
      camera.lookAt(smoothedAutoTarget.current)
      const desiredFov = current.cameraMode === 'vehicle' ? 68 : 64
      if (Math.abs(perspectiveCamera.fov - desiredFov) > 0.05) {
        perspectiveCamera.fov = THREE.MathUtils.lerp(
          perspectiveCamera.fov,
          desiredFov,
          1 - Math.exp(-delta * 14),
        )
        perspectiveCamera.updateProjectionMatrix()
      }
      if (usePlaybackStore.getState().activeStepIndex !== stepIndex)
        setActiveStep(stepIndex, current.mediaPointId ?? null)
      if (autoTime.current - lastUiUpdate.current > 0.12 || !isPlaying) {
        lastUiUpdate.current = autoTime.current
        setProgress(autoTime.current / activeJourneyDuration)
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
      enablePan={overviewUnlocked || setupEnabled}
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.55}
      zoomSpeed={0.7}
      panSpeed={0.78}
      screenSpacePanning
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      enabled={mode === 'overview' && (overviewUnlocked || setupEnabled)}
      maxDistance={modelFrame ? modelFrame.radius * 3 : 52}
      minDistance={orbitMinDistance(setupEnabled, modelFrame?.radius)}
      minPolarAngle={Math.PI * 0.19}
      maxPolarAngle={Math.PI * 0.455}
    />
  )
}
