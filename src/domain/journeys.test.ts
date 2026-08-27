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
      'servito-svolta',
    ])
    const commonIds = [
      'common-station',
      'common-beach-flag',
      'common-stendardo',
      'common-open',
      'common-differential',
      'common-standard-sign',
      'common-service-choice',
    ]
    for (const journey of STATION_JOURNEYS) {
      expect(journey.steps.slice(0, 7).map((step) => step.id)).toEqual(
        commonIds,
      )
      expect(journey.steps[6]?.decision).toBe('service-mode')
      expect(
        journey.steps.find((step) => step.id === journey.arrivalEndStepId),
      ).toBeDefined()
      expect(
        journey.steps.find((step) => step.id === journey.departureStartStepId),
      ).toBeDefined()
      expect(journeyDuration(journey)).toBeGreaterThan(100)
    }
    expect(
      getJourney('self-service').steps.some(
        (step) => step.decision === 'operator-payment',
      ),
    ).toBe(false)
    for (const id of ['servito', 'servito-svolta'] as const)
      expect(
        getJourney(id).steps.some(
          (step) =>
            step.id === 'served-payment-choice' &&
            step.decision === 'operator-payment',
        ),
      ).toBe(true)
  })

  it('keeps Journey A in the vehicle and returns the nozzle before payment', () => {
    const served = getJourney('servito')
    expect(served.steps.every((step) => step.cameraMode === 'vehicle')).toBe(
      true,
    )
    expect(dwellSeconds(served.steps)).toBeGreaterThanOrEqual(40)
    expect(dwellSeconds(served.steps)).toBeLessThanOrEqual(50)

    const nozzleStates = served.steps
      .filter((step) => step.nozzle)
      .map((step) => step.nozzle?.state)
    expect(nozzleStates).toEqual([
      'hand',
      'hand',
      'hand',
      'hand',
      'hand',
      'hand',
      'hand',
      'hand',
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
    const paymentChoiceIndex = served.steps.findIndex(
      (step) => step.id === 'served-payment-choice',
    )
    expect(replaceIndex).toBeGreaterThan(removeIndex)
    expect(paymentChoiceIndex).toBeGreaterThan(replaceIndex)
    expect(paymentIndex).toBeGreaterThan(replaceIndex)
    expect(paymentIndex).toBeGreaterThan(paymentChoiceIndex)
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
      'cash-instructions',
      'cash-amount',
      'review',
      'confirmed',
      'confirmed',
    ])
    expect(
      dwellSeconds(self.steps.filter((step) => step.nozzle)),
    ).toBeGreaterThanOrEqual(35)
    expect(
      dwellSeconds(self.steps.filter((step) => step.nozzle)),
    ).toBeLessThanOrEqual(45)
    expect(
      self.steps.findIndex((step) => step.id === 'self-payment-confirmed'),
    ).toBeLessThan(
      self.steps.findIndex((step) => step.id === 'self-take-nozzle'),
    )
  })

  it('enters Svolta diagonally, pays inside and returns without forced media gazes', () => {
    const svolta = getJourney('servito-svolta')
    const refuelIndex = svolta.steps.findIndex(
      (step) => step.id === 'served-refuel',
    )
    const replaceIndex = svolta.steps.findIndex(
      (step) => step.id === 'served-replace-nozzle',
    )
    const choiceIndex = svolta.steps.findIndex(
      (step) => step.id === 'served-payment-choice',
    )
    const entranceIndex = svolta.steps.findIndex(
      (step) => step.id === 'svolta-enter-store',
    )
    const paymentIndex = svolta.steps.findIndex(
      (step) => step.id === 'svolta-payment',
    )
    const exitIndex = svolta.steps.findIndex(
      (step) => step.id === 'svolta-exit-store',
    )
    expect(svolta.parkedVehicle?.position).toEqual([4.6, 0, 5.6])
    expect(refuelIndex).toBeGreaterThan(0)
    expect(replaceIndex).toBeGreaterThan(refuelIndex)
    expect(choiceIndex).toBeGreaterThan(replaceIndex)
    expect(entranceIndex).toBeGreaterThan(choiceIndex)
    expect(paymentIndex).toBeGreaterThan(entranceIndex)
    expect(exitIndex).toBeGreaterThan(paymentIndex)
    expect(
      svolta.steps.filter(
        (step) =>
          step.id.startsWith('svolta-') && step.mediaPointId === 'mp-06',
      ),
    ).toHaveLength(0)
    const clearCar = svolta.steps.find(
      (step) => step.id === 'svolta-clear-car',
    )!
    const centerAisle = svolta.steps.find(
      (step) => step.id === 'svolta-center-aisle',
    )!
    expect(centerAisle.position[0]).not.toBe(clearCar.position[0])
    expect(centerAisle.position[2]).not.toBe(clearCar.position[2])
    expect(
      dwellSeconds(svolta.steps.filter((step) => step.nozzle)),
    ).toBeGreaterThanOrEqual(40)
    expect(
      dwellSeconds(svolta.steps.filter((step) => step.nozzle)),
    ).toBeLessThanOrEqual(50)
    expect(svolta.steps.some((step) => step.id === 'svolta-take-nozzle')).toBe(
      false,
    )
  })

  it('falls back to Journey B', () => {
    expect(getJourney('unknown').id).toBe('self-service')
  })

  it('publishes named checkpoints for exact, pausable journey moments', () => {
    const checkpoints = getJourney('self-service')
      .steps.map((step) => step.checkpoint)
      .filter(Boolean)
    expect(checkpoints).toEqual(
      expect.arrayContaining([
        'Ingresso dalla corsia destra',
        'Auto accostata alla pompa',
        'Pagamento al totem',
        'Rifornimento in corso',
        'Ripartenza verso l’uscita',
      ]),
    )
  })
})
