export type JourneyId = 'self-service' | 'servito'

export type JourneyMotion =
  'drive' | 'brake' | 'exit' | 'walk' | 'glance' | 'hold'

export interface JourneyActorCue {
  type: 'attendant'
  position: [number, number, number]
  lookAt: [number, number, number]
  action: 'approach' | 'payment' | 'refuel' | 'return'
}

export interface JourneyStep {
  id: string
  label: string
  position: [number, number, number]
  gazeTarget: [number, number, number]
  duration: number
  cameraMode: 'vehicle' | 'pedestrian'
  motion: JourneyMotion
  mediaPointId?: string
  dwellSeconds?: number
  actor?: JourneyActorCue
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
    description:
      'Arrivo in auto, uscita del conducente, presa della pistola e rifornimento.',
    steps: [
      {
        id: 'self-start',
        label: 'Ingresso nella stazione',
        position: [-27, 1.28, 16],
        gazeTarget: [-16, 1.25, 10],
        duration: 0.15,
        cameraMode: 'vehicle',
        motion: 'drive',
        mediaPointId: 'mp-09',
      },
      {
        id: 'self-entry',
        label: 'Avvicinamento alla corsia Self',
        position: [-13, 1.28, 10.5],
        gazeTarget: [-3, 1.35, 7],
        duration: 3.2,
        cameraMode: 'vehicle',
        motion: 'drive',
        mediaPointId: 'mp-10',
      },
      {
        id: 'self-align',
        label: 'Allineamento alla pompa',
        position: [3.8, 1.28, 7.3],
        gazeTarget: [5, 1.5, 3.1],
        duration: 3.1,
        cameraMode: 'vehicle',
        motion: 'brake',
        mediaPointId: 'mp-02',
      },
      {
        id: 'self-stop',
        label: 'Arresto e controllo dell’erogatore',
        position: [5, 1.28, 7.2],
        gazeTarget: [5, 1.75, 3.1],
        duration: 1.4,
        cameraMode: 'vehicle',
        motion: 'glance',
        mediaPointId: 'mp-01',
        dwellSeconds: 1.4,
      },
      {
        id: 'self-exit',
        label: 'Uscita dalla vettura',
        position: [3.75, 1.68, 6.8],
        gazeTarget: [4.5, 1.45, 5.2],
        duration: 0.85,
        cameraMode: 'pedestrian',
        motion: 'exit',
      },
      {
        id: 'self-walk-rear',
        label: 'Cammino verso il bocchettone',
        position: [4.2, 1.68, 5.05],
        gazeTarget: [5.05, 1.18, 4.45],
        duration: 1.65,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'self-take-nozzle',
        label: 'Presa della pistola',
        position: [4.2, 1.68, 4.55],
        gazeTarget: [5.1, 1.15, 3.05],
        duration: 1.15,
        cameraMode: 'pedestrian',
        motion: 'glance',
        mediaPointId: 'mp-02',
      },
      {
        id: 'self-refuel',
        label: 'Rifornimento e lettura dei supporti',
        position: [4.25, 1.68, 4.65],
        gazeTarget: [6.4, 1.75, 1.2],
        duration: 4.4,
        cameraMode: 'pedestrian',
        motion: 'hold',
        mediaPointId: 'mp-03',
        dwellSeconds: 4.4,
      },
      {
        id: 'self-replace-nozzle',
        label: 'Chiusura del rifornimento',
        position: [4.2, 1.68, 4.5],
        gazeTarget: [5.05, 1.25, 3.05],
        duration: 1.35,
        cameraMode: 'pedestrian',
        motion: 'glance',
        mediaPointId: 'mp-01',
      },
    ],
  },
  {
    id: 'servito',
    name: 'Rifornimento Servito',
    description:
      'Arrivo in auto, pagamento al finestrino e rifornimento eseguito dall’operatore.',
    steps: [
      {
        id: 'served-start',
        label: 'Ingresso nella stazione',
        position: [-27, 1.28, 16],
        gazeTarget: [-17, 1.3, 10],
        duration: 0.15,
        cameraMode: 'vehicle',
        motion: 'drive',
        mediaPointId: 'mp-09',
      },
      {
        id: 'served-entry',
        label: 'Selezione corsia Servito',
        position: [-16, 1.28, 9.2],
        gazeTarget: [-8, 1.35, 5],
        duration: 2.8,
        cameraMode: 'vehicle',
        motion: 'drive',
        mediaPointId: 'mp-08',
      },
      {
        id: 'served-align',
        label: 'Allineamento all’operatore',
        position: [-6.2, 1.28, 7.15],
        gazeTarget: [-5, 1.45, 3],
        duration: 2.7,
        cameraMode: 'vehicle',
        motion: 'brake',
        mediaPointId: 'mp-04',
      },
      {
        id: 'served-stop',
        label: 'Arresto nella corsia assistita',
        position: [-5, 1.28, 7],
        gazeTarget: [-5, 1.7, 3.1],
        duration: 1.25,
        cameraMode: 'vehicle',
        motion: 'glance',
        mediaPointId: 'mp-04',
        actor: {
          type: 'attendant',
          position: [-8.2, 0, 5.5],
          lookAt: [-5, 1.2, 7],
          action: 'approach',
        },
      },
      {
        id: 'served-window',
        label: 'L’operatore arriva al finestrino',
        position: [-5, 1.28, 7],
        gazeTarget: [-6.15, 1.42, 6.7],
        duration: 2.1,
        cameraMode: 'vehicle',
        motion: 'glance',
        actor: {
          type: 'attendant',
          position: [-6.25, 0, 6.65],
          lookAt: [-5, 1.2, 7],
          action: 'approach',
        },
      },
      {
        id: 'served-payment',
        label: 'Richiesta e consegna del pagamento',
        position: [-5, 1.28, 7],
        gazeTarget: [-6.15, 1.15, 6.75],
        duration: 2.7,
        cameraMode: 'vehicle',
        motion: 'hold',
        mediaPointId: 'mp-05',
        dwellSeconds: 2.7,
        actor: {
          type: 'attendant',
          position: [-6.2, 0, 6.65],
          lookAt: [-5, 1.2, 7],
          action: 'payment',
        },
      },
      {
        id: 'served-refuel',
        label: 'L’operatore esegue il rifornimento',
        position: [-5, 1.28, 7],
        gazeTarget: [-6.05, 1.45, 3.35],
        duration: 4.3,
        cameraMode: 'vehicle',
        motion: 'glance',
        mediaPointId: 'mp-03',
        dwellSeconds: 4.3,
        actor: {
          type: 'attendant',
          position: [-6.05, 0, 3.65],
          lookAt: [-5, 1.15, 4.5],
          action: 'refuel',
        },
      },
      {
        id: 'served-look-around',
        label: 'Osservazione dei supporti dall’abitacolo',
        position: [-5, 1.28, 7],
        gazeTarget: [-11.5, 1.55, -1],
        duration: 2.6,
        cameraMode: 'vehicle',
        motion: 'glance',
        mediaPointId: 'mp-05',
        dwellSeconds: 2.6,
        actor: {
          type: 'attendant',
          position: [-6.05, 0, 3.65],
          lookAt: [-5, 1.15, 4.5],
          action: 'refuel',
        },
      },
      {
        id: 'served-finish',
        label: 'Chiusura e saluto dell’operatore',
        position: [-5, 1.28, 7],
        gazeTarget: [-6.15, 1.4, 6.7],
        duration: 2.1,
        cameraMode: 'vehicle',
        motion: 'glance',
        actor: {
          type: 'attendant',
          position: [-6.25, 0, 6.65],
          lookAt: [-5, 1.2, 7],
          action: 'return',
        },
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
