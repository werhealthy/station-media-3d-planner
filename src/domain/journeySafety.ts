import * as THREE from 'three'

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
 * Conservative floor footprints for every solid object touched by the two tours.
 * They intentionally include plinths and protection rails, not only visible meshes.
 */
export const JOURNEY_OBSTACLES: PlanarBounds[] = [
  { id: 'shop', minX: 3.2, maxX: 22.8, minZ: -14.4, maxZ: -5.3 },
  { id: 'price-pylon', minX: -23.9, maxX: -20.1, minZ: -10.9, maxZ: -9.1 },
  { id: 'roadside-landscape', minX: -25.3, maxX: -16.7, minZ: 12.75, maxZ: 14.65 },
  { id: 'pedestrian-curb', minX: -25, maxX: 5, minZ: 13.9, maxZ: 15.1 },
  { id: 'entry-tree', minX: -30.1, maxX: -27.9, minZ: 3.9, maxZ: 6.1 },
  { id: 'pump-front-self', minX: -7.2, maxX: -2.8, minZ: 1.8, maxZ: 3.8 },
  { id: 'pump-front-served', minX: 2.8, maxX: 7.2, minZ: 1.8, maxZ: 3.8 },
  { id: 'pump-back-self', minX: -7.2, maxX: -2.8, minZ: -4.2, maxZ: -2.2 },
  { id: 'pump-back-served', minX: 2.8, maxX: 7.2, minZ: -4.2, maxZ: -2.2 },
  { id: 'canopy-column-left', minX: -7.75, maxX: -6.25, minZ: -0.65, maxZ: 0.65 },
  { id: 'canopy-column-right', minX: 6.25, maxX: 7.75, minZ: -0.65, maxZ: 0.65 },
  { id: 'pump-ear-mp02', minX: 4.4, maxX: 5.6, minZ: 4.65, maxZ: 5.35 },
  { id: 'smartopt-mp05', minX: -12.05, maxX: -10.95, minZ: -1.35, maxZ: -0.35 },
  { id: 'shop-support-mp06', minX: 17.8, maxX: 19.2, minZ: -6.1, maxZ: -5.35 },
  { id: 'backdrop-mp07', minX: -13.1, maxX: -8.9, minZ: -6.55, maxZ: -5.95 },
  { id: 'flag-mp08', minX: -22.55, maxX: -21.45, minZ: -9.7, maxZ: -9.15 },
  { id: 'banner-mp09', minX: -20.65, maxX: -19.35, minZ: 7.65, maxZ: 8.35 },
  { id: 'concrete-sign-mp10', minX: -13.85, maxX: -12.15, minZ: 8.5, maxZ: 9.5 },
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
