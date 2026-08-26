/* eslint-disable react-hooks/immutability -- door leaves are mutable scene graph objects. */
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { STATION_LAYOUT } from '@/domain/stationLayout'
import { useStationRuntimeStore } from '@/stores/stationRuntimeStore'

interface MovingPart {
  object: THREE.Object3D
  closedX: number
  direction: -1 | 1
}

/** Opens the two Svolta leaves before the camera reaches the glazing. */
export function SvoltaDoorController() {
  const root = useStationRuntimeStore((state) => state.root)
  const { camera } = useThree()
  const parts = useRef<MovingPart[]>([])
  const openAmount = useRef(0)

  useEffect(() => {
    if (!root) return
    const next: MovingPart[] = []
    root.traverse((object) => {
      if (object.name !== 'shop-entry-door' && object.name !== 'door-handle')
        return
      next.push({
        object,
        closedX: object.position.x,
        direction: object.position.x < STATION_LAYOUT.shop.x ? -1 : 1,
      })
    })
    parts.current = next
    return () => {
      for (const part of next) part.object.position.x = part.closedX
      parts.current = []
    }
  }, [root])

  useFrame((_, delta) => {
    const entrance = new THREE.Vector2(
      STATION_LAYOUT.shop.x,
      STATION_LAYOUT.shop.z + STATION_LAYOUT.shop.depth / 2,
    )
    const distance = entrance.distanceTo(new THREE.Vector2(camera.position.x, camera.position.z))
    const desired = distance < 4.1 ? 1 : 0
    openAmount.current = THREE.MathUtils.lerp(
      openAmount.current,
      desired,
      1 - Math.exp(-delta * 5.5),
    )
    for (const part of parts.current)
      part.object.position.x =
        part.closedX + part.direction * 1.08 * openAmount.current
  })

  return null
}
