import { describe, expect, it } from 'vitest'
import {
  getJourney,
  journeyDuration,
  STATION_JOURNEYS,
  type JourneyStep,
} from './journeys'

function dwellSeconds(steps: JourneyStep[]): number {
  return steps.reduce((total, step) => total + (step.dwellSeconds ?? 0), 0)
}

describe('station journeys', () => {
  it('implements one shared entrance with the two authored decisions', () => {
    expect(STATION_JOURNEYS.map((journey) => journey.id)).toEqual([
      'servito',
      'self-service',
      'self-svolta',
    ])
    const commonIds = [
      'common-station',
      'common-stendardo',
      'common-beach-flag',
      'common-open',
      'common-differential',
      'common-service-choice',
    ]
    for (const journey of STATION_JOURNEYS) {
      expect(journey.steps.slice(0, 6).map((step) => step.id)).toEqual(
        commonIds,
      )
      expect(journey.steps[5]?.decision).toBe('service-mode')
      expect(journey.steps.find((step) => step.id === journey.arrivalEndStepId))
        .toBeDefined()
      expect(
        journey.steps.find((step) => step.id === journey.departureStartStepId),
      ).toBeDefined()
      expect(journeyDuration(journey)).toBeGreaterThan(100)
    }
    expect(
      getJourney('self-service').steps.find(
        (step) => step.id === 'self-payment-choice',
      )?.decision,
    ).toBe('payment-location')
  })

  it('keeps Journey A in the vehicle and returns the nozzle before payment', () => {
    const served = getJourney('servito')
    expect(served.steps.every((step) => step.cameraMode === 'vehicle')).toBe(
      true,
    )
    expect(dwellSeconds(served.steps)).toBe(60)

    const nozzleStates = served.steps
      .filter((step) => step.nozzle)
      .map((step) => step.nozzle?.state)
    expect(nozzleStates).toEqual([
      'hand',
      'hand',
      'inserting',
      'inserted',
      'inserted',
      'inserted',
      'removing',
      'hand',
      'returning',
      'holstered',
    ])

    const removeIndex = served.steps.findIndex(
      (step) => step.id === 'served-remove-nozzle',
    )
    const replaceIndex = served.steps.findIndex(
      (step) => step.id === 'served-replace-nozzle',
    )
    const paymentIndex = served.steps.findIndex(
      (step) => step.id === 'served-payment',
    )
    expect(replaceIndex).toBeGreaterThan(removeIndex)
    expect(paymentIndex).toBeGreaterThan(replaceIndex)
    expect(
      served.steps
        .slice(removeIndex, replaceIndex + 1)
        .every((step) => !step.mediaPointId),
    ).toBe(true)
  })

  it('plays the supplied SmartOPT sequence before the self refuel', () => {
    const self = getJourney('self-service')
    expect(self.parkedVehicle?.position).toEqual([-4.6, 0, 5.6])
    expect(
      self.steps
        .filter((step) => step.id.startsWith('self-') && step.terminalScreen)
        .map((step) => step.terminalScreen),
    ).toEqual([
      'idle',
      'idle',
      'idle',
      'idle',
      'idle',
      'payback',
      'pump',
      'fuel',
      'payment-method',
      'cash-instructions',
      'cash-amount',
      'review',
      'confirmed',
      'confirmed',
    ])
    expect(dwellSeconds(self.steps.filter((step) => step.nozzle))).toBe(60)
    expect(
      self.steps.findIndex((step) => step.id === 'self-payment-confirmed'),
    ).toBeLessThan(
      self.steps.findIndex((step) => step.id === 'self-take-nozzle'),
    )
  })

  it('enters Svolta, pays inside and exposes the store supports on return', () => {
    const svolta = getJourney('self-svolta')
    const entranceIndex = svolta.steps.findIndex(
      (step) => step.id === 'svolta-enter-store',
    )
    const paymentIndex = svolta.steps.findIndex(
      (step) => step.id === 'svolta-payment',
    )
    const exitIndex = svolta.steps.findIndex(
      (step) => step.id === 'svolta-exit-store',
    )
    expect(entranceIndex).toBeGreaterThan(0)
    expect(paymentIndex).toBeGreaterThan(entranceIndex)
    expect(exitIndex).toBeGreaterThan(paymentIndex)
    expect(
      svolta.steps.filter((step) => step.mediaPointId === 'mp-06').length,
    ).toBeGreaterThanOrEqual(2)
    expect(dwellSeconds(svolta.steps.filter((step) => step.nozzle))).toBe(60)
  })

  it('falls back to Journey B', () => {
    expect(getJourney('unknown').id).toBe('self-service')
  })
})
