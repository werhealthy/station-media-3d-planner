import { describe, expect, it } from 'vitest'
import { getJourney, journeyDuration, STATION_JOURNEYS } from './journeys'

describe('station journeys', () => {
  it('implements the three journeys defined by the supplied document', () => {
    expect(STATION_JOURNEYS.map((journey) => journey.id)).toEqual([
      'servito',
      'self-service',
      'self-svolta',
    ])
    for (const journey of STATION_JOURNEYS) {
      expect(journey.steps[0]?.cameraMode).toBe('vehicle')
      expect(journey.steps.some((step) => step.dwellSeconds)).toBe(true)
      expect(journeyDuration(journey)).toBeGreaterThan(100)
      expect(journey.steps.find((step) => step.id === journey.arrivalEndStepId))
        .toBeDefined()
    }
  })

  it('models Journey A as a static served experience paid at the end', () => {
    const served = getJourney('servito')
    expect(served.steps.every((step) => step.cameraMode === 'vehicle')).toBe(
      true,
    )
    const refuelIndex = served.steps.findIndex(
      (step) => step.id === 'served-refuel',
    )
    const paymentIndex = served.steps.findIndex(
      (step) => step.id === 'served-return-window',
    )
    expect(paymentIndex).toBeGreaterThan(refuelIndex)
    expect(
      served.steps
        .filter((step) =>
          ['served-refuel', 'served-look-column', 'served-look-topper'].includes(
            step.id,
          ),
        )
        .reduce((total, step) => total + step.duration, 0),
    ).toBe(48)
    const arrivalEnd = served.steps.findIndex(
      (step) => step.id === served.arrivalEndStepId,
    )
    expect(
      served.steps
        .slice(0, arrivalEnd + 1)
        .every((step) => step.actor?.action === 'wait'),
    ).toBe(true)
    expect(
      served.steps
        .slice(arrivalEnd)
        .every(
          (step) =>
            JSON.stringify(step.position) ===
            JSON.stringify([4.6, 1.28, 5.6]),
        ),
    ).toBe(true)
  })

  it('models Journey B as the acceptor loop with two pump contacts', () => {
    const self = getJourney('self-service')
    expect(self.parkedVehicle?.position).toEqual([-4.6, 0, 5.6])
    expect(self.steps.map((step) => step.id)).toEqual(
      expect.arrayContaining([
        'self-exit',
        'self-terminal',
        'self-payment',
        'self-take-nozzle',
        'self-refuel',
        'self-enter-car',
      ]),
    )
    expect(self.steps.find((step) => step.id === 'self-payment')?.duration).toBe(
      8,
    )
    expect(
      self.steps
        .filter((step) => step.id.startsWith('self-refuel'))
        .reduce((total, step) => total + step.duration, 0),
    ).toBe(48)
  })

  it('models Journey C as a real walk into Svolta and back', () => {
    const svolta = getJourney('self-svolta')
    const entranceIndex = svolta.steps.findIndex(
      (step) => step.id === 'svolta-enter-store',
    )
    const paymentIndex = svolta.steps.findIndex(
      (step) => step.id === 'svolta-payment',
    )
    const returnIndex = svolta.steps.findIndex(
      (step) => step.id === 'svolta-return-center',
    )
    expect(entranceIndex).toBeGreaterThan(0)
    expect(paymentIndex).toBeGreaterThan(entranceIndex)
    expect(returnIndex).toBeGreaterThan(paymentIndex)
    expect(
      svolta.steps.filter((step) => step.mediaPointId === 'mp-06').length,
    ).toBeGreaterThanOrEqual(2)
    expect(
      svolta.steps
        .filter((step) => step.id.startsWith('svolta-refuel'))
        .reduce((total, step) => total + step.duration, 0),
    ).toBe(48)
  })

  it('falls back to Journey B', () => {
    expect(getJourney('unknown').id).toBe('self-service')
  })
})
