import { describe, expect, it } from 'vitest'
import { getJourney, journeyDuration, STATION_JOURNEYS } from './journeys'

describe('station journeys', () => {
  it('defines distinct action-based self-service and served journeys', () => {
    expect(STATION_JOURNEYS.map((journey) => journey.id)).toEqual([
      'self-service',
      'servito',
    ])

    for (const journey of STATION_JOURNEYS) {
      expect(journey.steps[0]?.cameraMode).toBe('vehicle')
      expect(journey.steps.some((step) => step.dwellSeconds)).toBe(true)
      expect(journeyDuration(journey)).toBeGreaterThan(15)
    }

    const self = getJourney('self-service')
    expect(self.steps.some((step) => step.cameraMode === 'pedestrian')).toBe(
      true,
    )
    expect(self.steps.map((step) => step.id)).toEqual(
      expect.arrayContaining([
        'self-exit',
        'self-walk-rear',
        'self-take-nozzle',
        'self-refuel',
      ]),
    )

    const served = getJourney('servito')
    expect(served.steps.every((step) => step.cameraMode === 'vehicle')).toBe(
      true,
    )
    expect(served.steps.some((step) => step.actor?.action === 'payment')).toBe(
      true,
    )
    expect(served.steps.some((step) => step.actor?.action === 'refuel')).toBe(
      true,
    )
  })

  it('falls back to the self-service journey', () => {
    expect(getJourney('unknown').id).toBe('self-service')
  })
})
