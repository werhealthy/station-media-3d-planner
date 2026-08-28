import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { getJourney } from './journeys'
import {
  arrivalCurveCollisions,
  pedestrianCollisionAt,
  pedestrianVehicleCollisionAt,
} from './journeySafety'

function segmentCollisions(
  from: [number, number, number],
  to: [number, number, number],
): string[] {
  const collisions = new Set<string>()
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  for (let index = 0; index <= 80; index += 1) {
    const point = start.clone().lerp(end, index / 80)
    const collision = pedestrianCollisionAt(point)
    if (collision) collisions.add(collision.id)
  }
  return [...collisions]
}

function splineCollisions(points: Array<[number, number, number]>): string[] {
  const collisions = new Set<string>()
  const curve = new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(point[0], 0, point[2])),
    false,
    'centripetal',
    0.5,
  )
  for (let index = 0; index <= 160; index += 1) {
    const collision = pedestrianCollisionAt(curve.getPointAt(index / 160))
    if (collision) collisions.add(collision.id)
  }
  return [...collisions]
}

function segmentCrossesParkedVehicle(
  from: [number, number, number],
  to: [number, number, number],
  vehicle: { position: [number, number, number]; yaw: number },
): boolean {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  for (let index = 0; index <= 80; index += 1) {
    const point = start.clone().lerp(end, index / 80)
    if (pedestrianVehicleCollisionAt(point, vehicle)) return true
  }
  return false
}

describe('journey physical safety', () => {
  it.each(['servito', 'self-service', 'servito-svolta'] as const)(
    'keeps the full %s vehicle footprint outside every obstacle',
    (journeyId) => {
      const journey = getJourney(journeyId)
      expect(arrivalCurveCollisions(journey.arrivalPath)).toEqual([])
      expect(arrivalCurveCollisions(journey.departurePath)).toEqual([])
    },
  )

  it.each(['self-service', 'servito-svolta'] as const)(
    'keeps every %s pedestrian segment outside static supports',
    (journeyId) => {
      const steps = getJourney(journeyId).steps.filter(
        (step) => step.cameraMode === 'pedestrian',
      )
      for (let index = 1; index < steps.length; index += 1) {
        expect(
          segmentCollisions(steps[index - 1]!.position, steps[index]!.position),
          `${steps[index - 1]!.id} -> ${steps[index]!.id}`,
        ).toEqual([])
      }
    },
  )

  it.each(['self-service', 'servito-svolta'] as const)(
    'keeps every %s pedestrian segment outside the parked car',
    (journeyId) => {
      const journey = getJourney(journeyId)
      const vehicle = journey.parkedVehicle
      expect(vehicle).toBeDefined()
      if (!vehicle) return
      const steps = journey.steps.filter(
        (step) => step.cameraMode === 'pedestrian',
      )
      for (let index = 1; index < steps.length; index += 1) {
        expect(
          segmentCrossesParkedVehicle(
            steps[index - 1]!.position,
            steps[index]!.position,
            vehicle,
          ),
          `${steps[index - 1]!.id} -> ${steps[index]!.id}`,
        ).toBe(false)
      }
    },
  )

  it('routes the attendant around pumps and the pump-ear support', () => {
    const cues = getJourney('servito').steps.flatMap((step) =>
      step.actor ? [{ stepId: step.id, ...step.actor }] : [],
    )
    for (let index = 1; index < cues.length; index += 1) {
      expect(
        segmentCollisions(cues[index - 1]!.position, cues[index]!.position),
        `${cues[index - 1]!.stepId} -> ${cues[index]!.stepId}`,
      ).toEqual([])
    }
  })

  it('keeps the continuous Svolta walking splines clear of obstacles', () => {
    const journey = getJourney('servito-svolta')
    const sequences = [
      [
        'svolta-exit',
        'svolta-clear-car',
        'svolta-center-aisle',
        'svolta-behind-pumps',
        'svolta-frontage',
        'svolta-entrance',
        'svolta-enter-store',
        'svolta-counter',
      ],
      [
        'svolta-payment',
        'svolta-exit-store',
        'svolta-return-behind-pumps',
        'svolta-return-center',
        'svolta-return-car',
      ],
    ]
    for (const ids of sequences) {
      const points = ids.map((id) => {
        const step = journey.steps.find((candidate) => candidate.id === id)
        if (!step) throw new Error(`Step mancante: ${id}`)
        return step.position
      })
      expect(splineCollisions(points), ids.join(' -> ')).toEqual([])
    }
  })
})
