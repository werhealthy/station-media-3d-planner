import * as THREE from 'three'
import { STATION_LAYOUT as L } from './stationLayout'

export interface PlanarBounds {
  id: string
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export const VEHICLE_WIDTH = 1.9
export const VEHICLE_LENGTH = 4.4
export const PEDESTRIAN_RADIUS = 0.34

/**
 * Conservative floor footprints for every solid object touched by the tours.
 * They intentionally include plinths and protection rails, not only visible meshes.
 */
export const JOURNEY_OBSTACLES: PlanarBounds[] = [
  {
    id: 'shop-left-wall',
    minX: L.shop.x - L.shop.width / 2 - 0.02,
    maxX: L.shop.x - L.shop.width / 2 + 0.36,
    minZ: L.shop.z - L.shop.depth / 2,
    maxZ: L.shop.z + L.shop.depth / 2,
  },
  {
    id: 'shop-right-wall',
    minX: L.shop.x + L.shop.width / 2 - 0.36,
    maxX: L.shop.x + L.shop.width / 2 + 0.02,
    minZ: L.shop.z - L.shop.depth / 2,
    maxZ: L.shop.z + L.shop.depth / 2,
  },
  {
    id: 'shop-back-wall',
    minX: L.shop.x - L.shop.width / 2,
    maxX: L.shop.x + L.shop.width / 2,
    minZ: L.shop.z - L.shop.depth / 2 - 0.02,
    maxZ: L.shop.z - L.shop.depth / 2 + 0.36,
  },
  { id: 'shop-counter', minX: 10.7, maxX: 13.9, minZ: -9.1, maxZ: -8.2 },
  { id: 'price-pylon', minX: -19.6, maxX: -16.4, minZ: 9.7, maxZ: 11.1 },
  { id: 'roadside-landscape', minX: -21.7, maxX: -10.7, minZ: 10.9, maxZ: 13 },
  { id: 'pedestrian-curb', minX: -23, maxX: 0, minZ: 12.1, maxZ: 13.2 },
  { id: 'pump-self', minX: -6.6, maxX: -2.6, minZ: 0.5, maxZ: 2.7 },
  { id: 'pump-served', minX: 2.6, maxX: 6.6, minZ: 0.5, maxZ: 2.7 },
  {
    id: 'canopy-column-left',
    minX: -7.15,
    maxX: -5.65,
    minZ: -1.9,
    maxZ: -0.6,
  },
  { id: 'canopy-column-right', minX: 5.65, maxX: 7.15, minZ: -1.9, maxZ: -0.6 },
  { id: 'pump-leader-mp02', minX: -2.86, maxX: -2.24, minZ: 1.05, maxZ: 2.15 },
  {
    id: 'smartopt-mp05',
    minX: L.terminal.x - L.terminal.width / 2 - 0.08,
    maxX: L.terminal.x + L.terminal.width / 2 + 0.08,
    minZ: L.terminal.z - L.terminal.depth / 2 - 0.08,
    maxZ: L.terminal.z + L.terminal.depth / 2 + 0.08,
  },
  { id: 'shop-support-mp06', minX: 13.9, maxX: 15.3, minZ: -3.15, maxZ: -2.15 },
  { id: 'backdrop-mp07', minX: -4.75, maxX: -1.45, minZ: -4.6, maxZ: -3.95 },
  { id: 'stendardo-mp08', minX: -18.6, maxX: -17.4, minZ: 10.05, maxZ: 10.95 },
  { id: 'beach-flag-mp09', minX: -15.1, maxX: -13.9, minZ: 10.25, maxZ: 10.95 },
  {
    id: 'concrete-sign-mp10',
    minX: L.entry.concreteSignX - 0.85,
    maxX: L.entry.concreteSignX + 0.85,
    minZ: L.entry.concreteSignZ - 0.45,
    maxZ: L.entry.concreteSignZ + 0.45,
  },
]

export function createArrivalCurve(
  points: Array<[number, number, number]>,
): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point)),
    false,
    'centripetal',
    0.5,
  )
}

export function vehicleYawFromTangent(tangent: THREE.Vector3): number {
  return Math.atan2(-tangent.x, -tangent.z)
}

export function vehicleBoundsAt(
  position: Pick<THREE.Vector3, 'x' | 'z'>,
  yaw: number,
): Omit<PlanarBounds, 'id'> {
  const halfX =
    Math.abs(Math.cos(yaw)) * (VEHICLE_WIDTH / 2) +
    Math.abs(Math.sin(yaw)) * (VEHICLE_LENGTH / 2)
  const halfZ =
    Math.abs(Math.sin(yaw)) * (VEHICLE_WIDTH / 2) +
    Math.abs(Math.cos(yaw)) * (VEHICLE_LENGTH / 2)
  return {
    minX: position.x - halfX,
    maxX: position.x + halfX,
    minZ: position.z - halfZ,
    maxZ: position.z + halfZ,
  }
}

export function boundsIntersect(
  left: Omit<PlanarBounds, 'id'>,
  right: Omit<PlanarBounds, 'id'>,
  clearance = 0,
): boolean {
  return (
    left.minX < right.maxX + clearance &&
    left.maxX > right.minX - clearance &&
    left.minZ < right.maxZ + clearance &&
    left.maxZ > right.minZ - clearance
  )
}

export function vehicleCollisionAt(
  position: Pick<THREE.Vector3, 'x' | 'z'>,
  yaw: number,
): PlanarBounds | undefined {
  const footprint = vehicleBoundsAt(position, yaw)
  return JOURNEY_OBSTACLES.find((obstacle) =>
    boundsIntersect(footprint, obstacle, 0.08),
  )
}

export function pedestrianCollisionAt(
  position: Pick<THREE.Vector3, 'x' | 'z'>,
): PlanarBounds | undefined {
  const footprint = {
    minX: position.x - PEDESTRIAN_RADIUS,
    maxX: position.x + PEDESTRIAN_RADIUS,
    minZ: position.z - PEDESTRIAN_RADIUS,
    maxZ: position.z + PEDESTRIAN_RADIUS,
  }
  return JOURNEY_OBSTACLES.find((obstacle) =>
    boundsIntersect(footprint, obstacle),
  )
}

export function arrivalCurveCollisions(
  points: Array<[number, number, number]>,
  samples = 240,
): string[] {
  const curve = createArrivalCurve(points)
  const collisions = new Set<string>()
  for (let index = 0; index <= samples; index += 1) {
    const progress = index / samples
    const position = curve.getPointAt(progress)
    const yaw = vehicleYawFromTangent(curve.getTangentAt(progress))
    const obstacle = vehicleCollisionAt(position, yaw)
    if (obstacle) collisions.add(obstacle.id)
  }
  return [...collisions]
}
