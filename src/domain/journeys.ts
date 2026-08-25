export type JourneyId = 'self-service' | 'servito'

export type JourneyMotion =
  'drive' | 'brake' | 'exit' | 'enter' | 'walk' | 'glance' | 'hold'

export interface JourneyActorCue {
  type: 'attendant'
  position: [number, number, number]
  lookAt: [number, number, number]
  action:
    | 'approach'
    | 'payment'
    | 'take-nozzle'
    | 'refuel'
    | 'replace-nozzle'
    | 'return'
}

export interface JourneyStep {
  id: string
  label: string
  position: [number, number, number]
  gazeTarget: [number, number, number]
  duration: number
  cameraMode: 'vehicle' | 'pedestrian'
  motion: JourneyMotion
  vehicleYaw?: number
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

const EASTBOUND = -Math.PI / 2

export const STATION_JOURNEYS: StationJourney[] = [
  {
    id: 'self-service',
    name: 'Rifornimento Self',
    description:
      'Arrivo parallelo alla pompa, pagamento al terminale, rifornimento e ripartenza.',
    steps: [
      {
        id: 'self-start',
        label: 'Ingresso nella stazione',
        position: [-27, 1.28, 14],
        gazeTarget: [-19, 1.28, 10.5],
        duration: 0.2,
        cameraMode: 'vehicle',
        motion: 'drive',
        vehicleYaw: -1.18,
        mediaPointId: 'mp-09',
      },
      {
        id: 'self-entry',
        label: 'Ingresso graduale nel piazzale',
        position: [-20, 1.28, 10.5],
        gazeTarget: [-13, 1.3, 7.3],
        duration: 5.5,
        cameraMode: 'vehicle',
        motion: 'drive',
        vehicleYaw: -1.28,
        mediaPointId: 'mp-08',
      },
      {
        id: 'self-turn',
        label: 'Curva verso la corsia Self',
        position: [-14, 1.28, 7],
        gazeTarget: [-7, 1.3, 5.35],
        duration: 5,
        cameraMode: 'vehicle',
        motion: 'drive',
        vehicleYaw: -1.42,
        mediaPointId: 'mp-10',
      },
      {
        id: 'self-approach',
        label: 'Avvicinamento parallelo all’isola',
        position: [-9, 1.28, 5.2],
        gazeTarget: [-1, 1.3, 5.2],
        duration: 4,
        cameraMode: 'vehicle',
        motion: 'drive',
        vehicleYaw: EASTBOUND,
        mediaPointId: 'mp-02',
      },
      {
        id: 'self-brake',
        label: 'Frenata accanto alla pompa',
        position: [-5, 1.28, 5.2],
        gazeTarget: [3, 1.3, 5.2],
        duration: 3,
        cameraMode: 'vehicle',
        motion: 'brake',
        vehicleYaw: EASTBOUND,
      },
      {
        id: 'self-check-pump',
        label: 'Controllo della pompa dal finestrino',
        position: [-5, 1.28, 5.2],
        gazeTarget: [-5, 1.55, 2.8],
        duration: 2,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: EASTBOUND,
        mediaPointId: 'mp-01',
        dwellSeconds: 2,
      },
      {
        id: 'self-exit',
        label: 'Uscita dal lato conducente',
        position: [-5.3, 1.69, 4.15],
        gazeTarget: [-7.2, 1.35, 3.4],
        duration: 2.5,
        cameraMode: 'pedestrian',
        motion: 'exit',
      },
      {
        id: 'self-walk-terminal-1',
        label: 'Cammino verso il terminale Self',
        position: [-8.7, 1.69, 3.35],
        gazeTarget: [-10.7, 1.45, 0.5],
        duration: 3.5,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'self-walk-terminal-2',
        label: 'Arrivo al terminale di pagamento',
        position: [-11.15, 1.69, 0.25],
        gazeTarget: [-11.5, 1.45, -0.86],
        duration: 4,
        cameraMode: 'pedestrian',
        motion: 'walk',
        mediaPointId: 'mp-05',
      },
      {
        id: 'self-payment',
        label: 'Pagamento e selezione della pompa',
        position: [-11.15, 1.69, 0.25],
        gazeTarget: [-11.5, 1.43, -0.86],
        duration: 18,
        cameraMode: 'pedestrian',
        motion: 'hold',
        mediaPointId: 'mp-05',
        dwellSeconds: 18,
      },
      {
        id: 'self-payment-confirmed',
        label: 'Conferma dell’autorizzazione',
        position: [-11.15, 1.69, 0.25],
        gazeTarget: [-11.5, 1.56, -0.86],
        duration: 2.5,
        cameraMode: 'pedestrian',
        motion: 'glance',
        mediaPointId: 'mp-05',
      },
      {
        id: 'self-return-pump-1',
        label: 'Ritorno verso l’auto',
        position: [-8.5, 1.69, 2.2],
        gazeTarget: [-6.2, 1.35, 3.35],
        duration: 3.5,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'self-return-pump-2',
        label: 'Arrivo all’erogatore',
        position: [-5.5, 1.69, 3.8],
        gazeTarget: [-5, 1.18, 2.85],
        duration: 3.5,
        cameraMode: 'pedestrian',
        motion: 'walk',
        mediaPointId: 'mp-02',
      },
      {
        id: 'self-take-nozzle',
        label: 'Presa della pistola',
        position: [-5.5, 1.69, 3.8],
        gazeTarget: [-5, 1.12, 2.85],
        duration: 3,
        cameraMode: 'pedestrian',
        motion: 'glance',
        mediaPointId: 'mp-02',
      },
      {
        id: 'self-turn-filler',
        label: 'Rotazione verso il bocchettone',
        position: [-6.7, 1.69, 4.15],
        gazeTarget: [-7.05, 1.03, 4.35],
        duration: 2.5,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'self-insert-nozzle',
        label: 'Inserimento della pistola',
        position: [-6.7, 1.69, 4.15],
        gazeTarget: [-7.05, 1.03, 4.35],
        duration: 3,
        cameraMode: 'pedestrian',
        motion: 'glance',
      },
      {
        id: 'self-refuel',
        label: 'Erogazione del carburante',
        position: [-6.7, 1.69, 4.15],
        gazeTarget: [-7.05, 1.08, 4.35],
        duration: 32,
        cameraMode: 'pedestrian',
        motion: 'hold',
        dwellSeconds: 32,
      },
      {
        id: 'self-refuel-observe',
        label: 'Attesa e osservazione dei supporti',
        position: [-6.7, 1.69, 4.15],
        gazeTarget: [0, 2.05, 0.6],
        duration: 16,
        cameraMode: 'pedestrian',
        motion: 'glance',
        mediaPointId: 'mp-03',
        dwellSeconds: 16,
      },
      {
        id: 'self-remove-nozzle',
        label: 'Estrazione della pistola',
        position: [-6.7, 1.69, 4.15],
        gazeTarget: [-7.05, 1.03, 4.35],
        duration: 2.5,
        cameraMode: 'pedestrian',
        motion: 'glance',
      },
      {
        id: 'self-replace-nozzle',
        label: 'Riposo della pistola',
        position: [-5.5, 1.69, 3.8],
        gazeTarget: [-5, 1.12, 2.85],
        duration: 2.5,
        cameraMode: 'pedestrian',
        motion: 'walk',
        mediaPointId: 'mp-01',
      },
      {
        id: 'self-return-car',
        label: 'Ritorno alla portiera',
        position: [-5.3, 1.69, 4.15],
        gazeTarget: [-5, 1.22, 5.2],
        duration: 3,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'self-enter-car',
        label: 'Rientro nell’abitacolo',
        position: [-5, 1.28, 5.2],
        gazeTarget: [3, 1.3, 5.2],
        duration: 2.5,
        cameraMode: 'vehicle',
        motion: 'enter',
        vehicleYaw: EASTBOUND,
      },
      {
        id: 'self-depart',
        label: 'Ripartenza dalla stazione',
        position: [7, 1.28, 5.2],
        gazeTarget: [16, 1.3, 5.2],
        duration: 6,
        cameraMode: 'vehicle',
        motion: 'drive',
        vehicleYaw: EASTBOUND,
      },
    ],
  },
  {
    id: 'servito',
    name: 'Rifornimento Servito',
    description:
      'Arrivo parallelo, pagamento al finestrino e rifornimento dell’operatore.',
    steps: [
      {
        id: 'served-start',
        label: 'Ingresso nella stazione',
        position: [-27, 1.28, 14],
        gazeTarget: [-19, 1.28, 10.5],
        duration: 0.2,
        cameraMode: 'vehicle',
        motion: 'drive',
        vehicleYaw: -1.18,
        mediaPointId: 'mp-09',
      },
      {
        id: 'served-entry',
        label: 'Ingresso graduale nel piazzale',
        position: [-18, 1.28, 10.5],
        gazeTarget: [-10, 1.3, 7.3],
        duration: 5.5,
        cameraMode: 'vehicle',
        motion: 'drive',
        vehicleYaw: -1.28,
        mediaPointId: 'mp-08',
      },
      {
        id: 'served-turn',
        label: 'Curva verso la corsia Servito',
        position: [-8, 1.28, 7],
        gazeTarget: [0, 1.3, 5.35],
        duration: 5,
        cameraMode: 'vehicle',
        motion: 'drive',
        vehicleYaw: -1.42,
        mediaPointId: 'mp-10',
      },
      {
        id: 'served-approach',
        label: 'Avvicinamento parallelo all’isola',
        position: [0, 1.28, 5.2],
        gazeTarget: [8, 1.3, 5.2],
        duration: 4,
        cameraMode: 'vehicle',
        motion: 'drive',
        vehicleYaw: EASTBOUND,
        mediaPointId: 'mp-04',
      },
      {
        id: 'served-brake',
        label: 'Frenata accanto alla pompa',
        position: [5, 1.28, 5.2],
        gazeTarget: [13, 1.3, 5.2],
        duration: 3,
        cameraMode: 'vehicle',
        motion: 'brake',
        vehicleYaw: EASTBOUND,
      },
      {
        id: 'served-settle',
        label: 'Arresto nella corsia assistita',
        position: [5, 1.28, 5.2],
        gazeTarget: [5, 1.5, 2.9],
        duration: 2,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: EASTBOUND,
        mediaPointId: 'mp-04',
        actor: {
          type: 'attendant',
          position: [8.3, 0, 2.2],
          lookAt: [5, 1.2, 5.2],
          action: 'approach',
        },
      },
      {
        id: 'served-window',
        label: 'L’operatore arriva al finestrino sinistro',
        position: [5, 1.28, 5.2],
        gazeTarget: [5, 1.42, 3.95],
        duration: 5,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: EASTBOUND,
        actor: {
          type: 'attendant',
          position: [5, 0, 3.95],
          lookAt: [5, 1.2, 5.2],
          action: 'approach',
        },
      },
      {
        id: 'served-payment',
        label: 'Pagamento dal finestrino',
        position: [5, 1.28, 5.2],
        gazeTarget: [5, 1.2, 3.95],
        duration: 12,
        cameraMode: 'vehicle',
        motion: 'hold',
        vehicleYaw: EASTBOUND,
        actor: {
          type: 'attendant',
          position: [5, 0, 3.95],
          lookAt: [5, 1.2, 5.2],
          action: 'payment',
        },
      },
      {
        id: 'served-take-nozzle',
        label: 'L’operatore raggiunge la pompa',
        position: [5, 1.28, 5.2],
        gazeTarget: [5, 1.35, 3.15],
        duration: 5,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: EASTBOUND,
        mediaPointId: 'mp-02',
        actor: {
          type: 'attendant',
          position: [5, 0, 3.35],
          lookAt: [3.2, 1.05, 4.2],
          action: 'take-nozzle',
        },
      },
      {
        id: 'served-insert-nozzle',
        label: 'Inserimento della pistola',
        position: [5, 1.28, 5.2],
        gazeTarget: [3.15, 1.25, 4.05],
        duration: 3,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: EASTBOUND,
        actor: {
          type: 'attendant',
          position: [3.15, 0, 4.05],
          lookAt: [3, 1.05, 4.35],
          action: 'refuel',
        },
      },
      {
        id: 'served-refuel',
        label: 'L’operatore esegue il rifornimento',
        position: [5, 1.28, 5.2],
        gazeTarget: [3.15, 1.35, 4.05],
        duration: 32,
        cameraMode: 'vehicle',
        motion: 'hold',
        vehicleYaw: EASTBOUND,
        dwellSeconds: 32,
        actor: {
          type: 'attendant',
          position: [3.15, 0, 4.05],
          lookAt: [3, 1.05, 4.35],
          action: 'refuel',
        },
      },
      {
        id: 'served-look-around',
        label: 'Osservazione dall’abitacolo durante l’attesa',
        position: [5, 1.28, 5.2],
        gazeTarget: [12.5, 1.85, -4],
        duration: 16,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: EASTBOUND,
        mediaPointId: 'mp-06',
        dwellSeconds: 16,
        actor: {
          type: 'attendant',
          position: [3.15, 0, 4.05],
          lookAt: [3, 1.05, 4.35],
          action: 'refuel',
        },
      },
      {
        id: 'served-replace-nozzle',
        label: 'Chiusura del rifornimento',
        position: [5, 1.28, 5.2],
        gazeTarget: [5, 1.3, 3.35],
        duration: 4,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: EASTBOUND,
        actor: {
          type: 'attendant',
          position: [5, 0, 3.35],
          lookAt: [5, 1.12, 2.85],
          action: 'replace-nozzle',
        },
      },
      {
        id: 'served-return-window',
        label: 'L’operatore torna al finestrino',
        position: [5, 1.28, 5.2],
        gazeTarget: [5, 1.4, 3.95],
        duration: 5,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: EASTBOUND,
        actor: {
          type: 'attendant',
          position: [5, 0, 3.95],
          lookAt: [5, 1.2, 5.2],
          action: 'return',
        },
      },
      {
        id: 'served-finish',
        label: 'Consegna ricevuta e saluto',
        position: [5, 1.28, 5.2],
        gazeTarget: [5, 1.2, 3.95],
        duration: 3,
        cameraMode: 'vehicle',
        motion: 'hold',
        vehicleYaw: EASTBOUND,
        actor: {
          type: 'attendant',
          position: [5, 0, 3.95],
          lookAt: [5, 1.2, 5.2],
          action: 'return',
        },
      },
      {
        id: 'served-depart',
        label: 'Ripartenza dalla stazione',
        position: [17, 1.28, 5.2],
        gazeTarget: [25, 1.3, 5.2],
        duration: 6,
        cameraMode: 'vehicle',
        motion: 'drive',
        vehicleYaw: EASTBOUND,
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
