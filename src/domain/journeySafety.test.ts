import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { getJourney } from './journeys'
import {
  arrivalCurveCollisions,
  pedestrianCollisionAt,
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

describe('journey physical safety', () => {
  it.each(['self-service', 'servito'] as const)(
    'keeps the full %s vehicle footprint outside every obstacle',
    (journeyId) => {
      expect(arrivalCurveCollisions(getJourney(journeyId).arrivalPath)).toEqual(
        [],
      )
    },
  )

  it('keeps every self-service pedestrian segment outside static supports', () => {
    const steps = getJourney('self-service').steps.filter(
      (step) => step.cameraMode === 'pedestrian',
    )
    for (let index = 1; index < steps.length; index += 1) {
      expect(
        segmentCollisions(steps[index - 1]!.position, steps[index]!.position),
        `${steps[index - 1]!.id} -> ${steps[index]!.id}`,
      ).toEqual([])
    }
  })

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
})
