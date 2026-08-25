export type JourneyId = 'self-service' | 'servito'

export interface JourneyStep {
  id: string
  label: string
  position: [number, number, number]
  gazeTarget: [number, number, number]
  duration: number
  cameraMode: 'vehicle' | 'pedestrian'
  mediaPointId?: string
  dwellSeconds?: number
}

export interface StationJourney {
  id: JourneyId
  name: string
  description: string
  steps: JourneyStep[]
}

export const STATION_JOURNEYS: StationJourney[] = [
  {
    id: 'self-service',
    name: 'Rifornimento Self',
    description: 'Ingresso in auto, avvicinamento alla pompa e sosta autonoma.',
    steps: [
      {
        id: 'self-start',
        label: 'Ingresso nella stazione',
        position: [-27, 1.28, 16],
        gazeTarget: [-16, 1.25, 10],
        duration: 0.2,
        cameraMode: 'vehicle',
        mediaPointId: 'mp-09',
      },
      {
        id: 'self-entry',
        label: 'Avvicinamento alle isole',
        position: [-14, 1.28, 11],
        gazeTarget: [-4, 1.35, 7],
        duration: 5.2,
        cameraMode: 'vehicle',
        mediaPointId: 'mp-10',
      },
      {
        id: 'self-turn',
        label: 'Allineamento alla pompa Self',
        position: [-2, 1.28, 8.5],
        gazeTarget: [5, 1.45, 5],
        duration: 4.4,
        cameraMode: 'vehicle',
        mediaPointId: 'mp-02',
      },
      {
        id: 'self-stop',
        label: 'Arresto accanto all’erogatore',
        position: [5, 1.28, 7.2],
        gazeTarget: [5, 1.75, 3.1],
        duration: 3.8,
        cameraMode: 'vehicle',
        mediaPointId: 'mp-01',
        dwellSeconds: 3.8,
      },
      {
        id: 'self-observe',
        label: 'Lettura durante la sosta',
        position: [5, 1.28, 7.2],
        gazeTarget: [7, 2.1, 0.4],
        duration: 4.8,
        cameraMode: 'vehicle',
        mediaPointId: 'mp-03',
        dwellSeconds: 4.8,
      },
    ],
  },
  {
    id: 'servito',
    name: 'Rifornimento Servito',
    description: 'Ingresso in auto e sosta sulla corsia assistita.',
    steps: [
      {
        id: 'served-start',
        label: 'Ingresso nella stazione',
        position: [-27, 1.28, 16],
        gazeTarget: [-17, 1.3, 10],
        duration: 0.2,
        cameraMode: 'vehicle',
        mediaPointId: 'mp-09',
      },
      {
        id: 'served-entry',
        label: 'Selezione corsia Servito',
        position: [-17, 1.28, 9],
        gazeTarget: [-8, 1.35, 5],
        duration: 4.8,
        cameraMode: 'vehicle',
        mediaPointId: 'mp-08',
      },
      {
        id: 'served-align',
        label: 'Allineamento all’operatore',
        position: [-10, 1.28, 7],
        gazeTarget: [-5, 1.45, 3],
        duration: 4.2,
        cameraMode: 'vehicle',
        mediaPointId: 'mp-04',
      },
      {
        id: 'served-stop',
        label: 'Sosta nella corsia assistita',
        position: [-5, 1.28, 7],
        gazeTarget: [-5, 1.8, 3.1],
        duration: 4.5,
        cameraMode: 'vehicle',
        mediaPointId: 'mp-04',
        dwellSeconds: 4.5,
      },
      {
        id: 'served-payment',
        label: 'Totem e pagamento',
        position: [-5, 1.28, 7],
        gazeTarget: [-11.5, 1.45, -1],
        duration: 4.5,
        cameraMode: 'vehicle',
        mediaPointId: 'mp-05',
        dwellSeconds: 4.5,
      },
    ],
  },
]

export function getJourney(id: string | null | undefined): StationJourney {
  return (
    STATION_JOURNEYS.find((journey) => journey.id === id) ??
    STATION_JOURNEYS[0]!
  )
}

export function journeyDuration(journey: StationJourney): number {
  return journey.steps.reduce((total, step) => total + step.duration, 0)
}
