import { Canvas as R3FCanvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import { StationModel } from './StationModel'
import { AdvertisingPointsLayer } from './AdvertisingPointsLayer'
import { proceduralAdapter } from '@/adapters/station-model/proceduralAdapter'

function ConstrainedCameraController() {
  const camera = useThree((state) => state.camera)
  const keysPressed = useRef<{ [key: string]: boolean }>({})

  const MIN_HEIGHT = 5
  const MAX_HEIGHT = 80
  const PAN_SPEED = 0.5
  const ZOOM_SPEED = 2

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // In React Three Fiber, mutating Three.js objects directly in useFrame is correct
  // and necessary for performance (avoid React re-renders for per-frame updates).
  /* eslint-disable react-hooks/immutability */
  useFrame(() => {
    const pos = camera.position
    const keys = keysPressed.current
    let moved = false

    // W: move forward (away from center)
    if (keys['w']) {
      const dir = pos.clone().sub(new Vector3(0, pos.y, 0)).normalize()
      pos.x += dir.x * PAN_SPEED
      pos.z += dir.z * PAN_SPEED
      moved = true
    }
    // S: move backward (toward center)
    if (keys['s']) {
      const dir = pos.clone().sub(new Vector3(0, pos.y, 0)).normalize()
      pos.x -= dir.x * PAN_SPEED
      pos.z -= dir.z * PAN_SPEED
      moved = true
    }
    // A: move left
    if (keys['a']) {
      const dir = pos.clone().sub(new Vector3(0, pos.y, 0)).normalize()
      const leftDir = new Vector3(-dir.z, 0, dir.x)
      pos.x -= leftDir.x * PAN_SPEED
      pos.z -= leftDir.z * PAN_SPEED
      moved = true
    }
    // D: move right
    if (keys['d']) {
      const dir = pos.clone().sub(new Vector3(0, pos.y, 0)).normalize()
      const rightDir = new Vector3(dir.z, 0, -dir.x)
      pos.x += rightDir.x * PAN_SPEED
      pos.z += rightDir.z * PAN_SPEED
      moved = true
    }
    // Q: zoom out (increase height)
    if (keys['q']) {
      pos.y = Math.min(pos.y + ZOOM_SPEED, MAX_HEIGHT)
      moved = true
    }
    // E: zoom in (decrease height)
    if (keys['e']) {
      pos.y = Math.max(pos.y - ZOOM_SPEED, MIN_HEIGHT)
      moved = true
    }

    if (moved) {
      camera.lookAt(0, 0, 0)
    }
  })
  /* eslint-enable react-hooks/immutability */

  return null
}

export function Canvas() {
  return (
    <R3FCanvas shadows="basic" camera={{ position: [40, 35, 40], fov: 60, near: 0.1, far: 200 }}>
      <Suspense fallback={null}>
        {/* Illuminazione */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[25, 35, 20]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={120}
          shadow-camera-left={-60}
          shadow-camera-right={60}
          shadow-camera-top={60}
          shadow-camera-bottom={-60}
        />
        {/* Fill light per ridurre ombre troppo forti */}
        <directionalLight
          position={[-15, 20, -25]}
          intensity={0.4}
        />

        {/* Constrained top-down camera controller */}
        <ConstrainedCameraController />

        {/* Stazione (via StationModelAdapter, mai generata/caricata direttamente qui) */}
        <StationModel adapter={proceduralAdapter} />

        {/* Punti pubblicitari (banner) */}
        <AdvertisingPointsLayer />

        {/* Background - cielo realistico */}
        <color attach="background" args={['#a8c5dd']} />
      </Suspense>
    </R3FCanvas>
  )
}
