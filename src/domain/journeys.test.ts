import { describe, expect, it } from 'vitest'
import {
  getJourney,
  journeyDuration,
  STATION_JOURNEYS,
  type JourneyStep,
} from './journeys'
import { STATION_LAYOUT as L } from './stationLayout'

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
      'common-stendardo',
      'common-beach-flag',
      'common-open',
      'common-standard-sign',
      'common-service-choice',
    ]
    for (const journey of STATION_JOURNEYS) {
      expect(journey.steps.slice(0, 5).map((step) => step.id)).toEqual(
        commonIds,
      )
      expect(journey.steps[4]?.decision).toBe('service-mode')
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

  it('keeps Journey A in the vehicle and directs attention during fueling', () => {
    const served = getJourney('servito')
    expect(served.steps.every((step) => step.cameraMode === 'vehicle')).toBe(
      true,
    )
    expect(dwellSeconds(served.steps)).toBeGreaterThanOrEqual(30)
    expect(dwellSeconds(served.steps)).toBeLessThanOrEqual(38)

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
      new Set(
        served.steps
          .filter((step) => step.id.includes('dwell'))
          .map((step) => step.gazeTarget.join(',')),
      ).size,
    ).toBeGreaterThanOrEqual(3)
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
    ).toBeGreaterThanOrEqual(20)
    expect(
      dwellSeconds(self.steps.filter((step) => step.nozzle)),
    ).toBeLessThanOrEqual(26)
    expect(
      self.steps.findIndex((step) => step.id === 'self-payment-confirmed'),
    ).toBeLessThan(self.steps.findIndex((step) => step.id === 'self-refuel'))

    const start = self.steps.find((step) => step.id === 'self-refuel')!
    const column = self.steps.find((step) => step.id === 'self-dwell-column')!
    const triad = self.steps.find((step) => step.id === 'self-dwell-triad')!
    expect(start.gazeTarget[1]).toBeLessThan(1)
    expect(column.gazeTarget).toEqual([L.canopy.columnX, 1.65, -0.86])
    expect(column.mediaPointId).toBe('mp-03')
    expect(triad.gazeTarget).toEqual([
      -L.islands.pumpX,
      2.82,
      L.islands.frontZ + 0.49,
    ])
    expect(triad.mediaPointId).toBe('mp-01')
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
    ).toBeGreaterThanOrEqual(30)
    expect(
      dwellSeconds(svolta.steps.filter((step) => step.nozzle)),
    ).toBeLessThanOrEqual(38)
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
        'Stendardo',
        'Beach Flag',
        'Auto accostata alla pompa',
        'Pagamento al totem',
        'Rifornimento in corso',
        'Ripartenza verso l’uscita',
      ]),
    )
  })

  it('cuts once between car and pedestrian POV but crosses Svolta continuously', () => {
    for (const id of [
      'self-exit',
      'self-enter-car',
      'svolta-exit',
      'svolta-enter-car',
    ]) {
      const journey = id.startsWith('self-')
        ? getJourney('self-service')
        : getJourney('servito-svolta')
      expect(
        journey.steps.find((step) => step.id === id)?.cameraTransition,
      ).toBe('fade-cut')
    }
    for (const id of ['svolta-enter-store', 'svolta-exit-store']) {
      expect(
        getJourney('servito-svolta').steps.find((step) => step.id === id)
          ?.cameraTransition,
      ).toBeUndefined()
    }
  })
})
