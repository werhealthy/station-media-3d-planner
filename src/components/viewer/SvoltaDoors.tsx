import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useStationRuntimeStore } from '@/stores/stationRuntimeStore'

const ENTRANCE = new THREE.Vector3(9.5, 1.7, -4.2)

/** Automatic sliding doors shared by free and guided first-person modes. */
export function SvoltaDoors() {
  const root = useStationRuntimeStore((state) => state.root)
  const { camera } = useThree()
  const leftDoor = useRef<THREE.Object3D | null>(null)
  const rightDoor = useRef<THREE.Object3D | null>(null)
  const leftHandle = useRef<THREE.Object3D | null>(null)
  const rightHandle = useRef<THREE.Object3D | null>(null)

  useEffect(() => {
    leftDoor.current = root?.getObjectByName('shop-entry-door-left') ?? null
    rightDoor.current = root?.getObjectByName('shop-entry-door-right') ?? null
    leftHandle.current = root?.getObjectByName('door-handle-left') ?? null
    rightHandle.current = root?.getObjectByName('door-handle-right') ?? null
  }, [root])

  useFrame((_, delta) => {
    const open = camera.position.distanceToSquared(ENTRANCE) < 16
    const settle = 1 - Math.exp(-delta * 5.5)
    const targets = open
      ? [7.85, 11.15, 8.85, 10.15]
      : [8.75, 10.25, 9.22, 9.78]
    const objects = [
      leftDoor.current,
      rightDoor.current,
      leftHandle.current,
      rightHandle.current,
    ]
    objects.forEach((object, index) => {
      if (object) object.position.x = THREE.MathUtils.lerp(object.position.x, targets[index]!, settle)
    })
  })

  return null
}
