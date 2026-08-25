import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getJourney } from '@/domain/journeys'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useViewerStore } from '@/stores/viewerStore'

const destination = new THREE.Vector3()
const gaze = new THREE.Vector3()

export function JourneyActors() {
  const mode = useViewerStore((state) => state.navigationMode)
  const routeId = usePlaybackStore((state) => state.activeRouteId)
  const activeStepIndex = usePlaybackStore((state) => state.activeStepIndex)
  const attendant = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const initialized = useRef(false)
  const step = getJourney(routeId).steps[activeStepIndex]
  const cue = mode === 'auto' ? step?.actor : undefined

  useEffect(() => {
    if (!cue) initialized.current = false
  }, [cue])

  useFrame((_, delta) => {
    if (!attendant.current || !cue) return
    destination.set(...cue.position)
    if (!initialized.current) {
      attendant.current.position.copy(destination)
      initialized.current = true
    } else {
      attendant.current.position.lerp(destination, 1 - Math.exp(-delta * 4.8))
    }
    gaze.set(...cue.lookAt)
    const yaw = Math.atan2(
      gaze.x - attendant.current.position.x,
      gaze.z - attendant.current.position.z,
    )
    attendant.current.rotation.y = THREE.MathUtils.lerp(
      attendant.current.rotation.y,
      yaw,
      1 - Math.exp(-delta * 8),
    )
    if (rightArm.current) {
      const raised =
        cue.action === 'payment' ? -1.02 : cue.action === 'refuel' ? -0.48 : 0
      rightArm.current.rotation.x = THREE.MathUtils.lerp(
        rightArm.current.rotation.x,
        raised,
        1 - Math.exp(-delta * 9),
      )
    }
  })

  return (
    <group ref={attendant} visible={Boolean(cue)}>
      <RoundedBox
        args={[0.46, 0.72, 0.28]}
        radius={0.12}
        smoothness={4}
        position={[0, 1.17, 0]}
        castShadow
      >
        <meshStandardMaterial color="#13337a" roughness={0.82} />
      </RoundedBox>
      <mesh position={[0, 1.75, 0]} castShadow>
        <capsuleGeometry args={[0.135, 0.12, 8, 18]} />
        <meshStandardMaterial color="#c98d73" roughness={0.78} />
      </mesh>
      {([-1, 1] as const).map((side) => (
        <group
          key={side}
          ref={side === 1 ? rightArm : undefined}
          position={[side * 0.29, 1.4, 0]}
        >
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.34, 6, 14]} />
            <meshStandardMaterial color="#173b8d" roughness={0.82} />
          </mesh>
          <mesh position={[0, -0.5, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.08, 6, 14]} />
            <meshStandardMaterial color="#c98d73" roughness={0.78} />
          </mesh>
        </group>
      ))}
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 0.13, 0.68, 0]}>
          <mesh position={[0, -0.32, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.48, 6, 14]} />
            <meshStandardMaterial color="#202a3a" roughness={0.86} />
          </mesh>
          <RoundedBox
            args={[0.17, 0.1, 0.34]}
            radius={0.04}
            smoothness={3}
            position={[0, -0.66, -0.025]}
            castShadow
          >
            <meshStandardMaterial color="#111722" roughness={0.7} />
          </RoundedBox>
        </group>
      ))}
      <mesh position={[0, 1.32, -0.148]}>
        <planeGeometry args={[0.2, 0.09]} />
        <meshStandardMaterial color="#f5b51b" roughness={0.65} />
      </mesh>
    </group>
  )
}
