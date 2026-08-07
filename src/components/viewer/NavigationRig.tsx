/* eslint-disable react-hooks/immutability -- R3F camera/control objects are mutable scene graph state. */
import { OrbitControls, PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { HOTSPOTS } from '@/domain/hotspots'
import { useViewerStore } from '@/stores/viewerStore'

const OVERVIEW_POSITION = new THREE.Vector3(31, 19, 34)
const OVERVIEW_TARGET = new THREE.Vector3(1, 2, -2)
const EYE_HEIGHT = 1.7

export function NavigationRig() {
  const mode = useViewerStore((s) => s.navigationMode)
  const activeHotspotId = useViewerStore((s) => s.activeHotspotId)
  const setMode = useViewerStore((s) => s.setNavigationMode)
  const { camera, gl } = useThree()
  const perspectiveCamera = camera as THREE.PerspectiveCamera
  const orbit = useRef<OrbitControlsImpl>(null)
  const keys = useRef(new Set<string>())
  const destination = useMemo(() => new THREE.Vector3(), [])
  const target = useMemo(() => new THREE.Vector3(), [])

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
    }
  }, [camera, mode, perspectiveCamera])

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
      if (move.lengthSq()) {
        const next = camera.position
          .clone()
          .add(move.normalize().multiplyScalar(delta * 5.2))
        next.x = THREE.MathUtils.clamp(next.x, -29, 29)
        next.z = THREE.MathUtils.clamp(next.z, -20, 20)
        // Conservative rectangular exclusion for the shop volume.
        if (!(next.x > 3.5 && next.x < 22.5 && next.z < -5.5))
          camera.position.copy(next)
      }
      camera.position.y = EYE_HEIGHT
      return
    }

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
      enabled={mode === 'overview'}
      minDistance={22}
      maxDistance={58}
      minPolarAngle={Math.PI * 0.2}
      maxPolarAngle={Math.PI * 0.46}
    />
  )
}
