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
      expect(journeyDuration(journey)).toBeGreaterThan(100)
    }

    const self = getJourney('self-service')
    expect(self.steps.some((step) => step.cameraMode === 'pedestrian')).toBe(
      true,
    )
    expect(self.steps.map((step) => step.id)).toEqual(
      expect.arrayContaining([
        'self-exit',
        'self-payment',
        'self-take-nozzle',
        'self-insert-nozzle',
        'self-refuel',
        'self-enter-car',
        'self-finish',
      ]),
    )
    expect(
      self.steps
        .filter((step) => step.id.startsWith('self-refuel'))
        .reduce((total, step) => total + step.duration, 0),
    ).toBe(48)
    expect(self.steps.find((step) => step.id === 'self-brake')).toMatchObject({
      position: [-5, 1.28, 7.2],
      vehicleYaw: Math.PI / 2,
    })
    expect(self.steps.find((step) => step.id === 'self-payment')?.duration).toBe(
      8,
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
    const servedArrivalEnd = served.steps.findIndex(
      (step) => step.id === served.arrivalEndStepId,
    )
    expect(
      served.steps
        .slice(0, servedArrivalEnd + 1)
        .every((step) => step.actor?.action === 'wait'),
    ).toBe(true)
    expect(
      served.steps
        .filter((step) =>
          ['served-refuel', 'served-look-shop', 'served-look-side'].includes(
            step.id,
          ),
        )
        .reduce((total, step) => total + step.duration, 0),
    ).toBe(48)

    const parkedServedSteps = served.steps.filter((step) => {
      const start = served.steps.findIndex(
        (item) => item.id === 'served-settle',
      )
      const end = served.steps.length
      const index = served.steps.indexOf(step)
      return index >= start && index < end
    })
    expect(parkedServedSteps).not.toHaveLength(0)
    expect(
      parkedServedSteps.every(
        (step) =>
          JSON.stringify(step.position) === JSON.stringify([5, 1.28, 7.2]),
      ),
    ).toBe(true)
    expect(
      parkedServedSteps.every((step) => step.vehicleYaw === Math.PI / 2),
    ).toBe(true)
  })

  it('falls back to the self-service journey', () => {
    expect(getJourney('unknown').id).toBe('self-service')
  })
})
