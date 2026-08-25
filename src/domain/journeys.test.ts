import { describe, expect, it } from 'vitest'
import { getJourney, journeyDuration, STATION_JOURNEYS } from './journeys'

describe('station journeys', () => {
  it('defines distinct self-service and served car journeys', () => {
    expect(STATION_JOURNEYS.map((journey) => journey.id)).toEqual([
      'self-service',
      'servito',
    ])

    for (const journey of STATION_JOURNEYS) {
      expect(journey.steps[0]?.cameraMode).toBe('vehicle')
      expect(journey.steps.some((step) => step.dwellSeconds)).toBe(true)
      expect(journeyDuration(journey)).toBeGreaterThan(15)
    }
  })

  it('falls back to the self-service journey', () => {
    expect(getJourney('unknown').id).toBe('self-service')
  })
})
