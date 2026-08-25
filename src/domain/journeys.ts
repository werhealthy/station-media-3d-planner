export type JourneyId = 'self-service' | 'servito'

export type JourneyMotion =
  | 'drive'
  | 'brake'
  | 'exit'
  | 'enter'
  | 'walk'
  | 'glance'
  | 'hold'

export interface JourneyActorCue {
  type: 'attendant'
  position: [number, number, number]
  lookAt: [number, number, number]
  action:
    | 'wait'
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
  /** Safe centreline used without per-step stops through arrivalEndStepId. */
  arrivalPath: Array<[number, number, number]>
  arrivalEndStepId: string
  steps: JourneyStep[]
}

const WESTBOUND = Math.PI / 2
const ATTENDANT_WAIT: [number, number, number] = [9.3, 0, 4.4]
const SELF_STOP: [number, number, number] = [-5, 1.28, 7.2]
const SERVED_STOP: [number, number, number] = [5, 1.28, 7.2]

const sharedArrival: Array<[number, number, number]> = [
  [-30, 1.28, 19.5],
  [-20, 1.28, 19.5],
  [-8, 1.28, 19.5],
  [5.5, 1.28, 19.4],
  [14.5, 1.28, 18.6],
  [19, 1.28, 16.2],
  [20, 1.28, 12.6],
  [18.5, 1.28, 9.4],
  [14.5, 1.28, 7.6],
]

const selfArrival = [...sharedArrival, [7, 1.28, 7.2], [0, 1.28, 7.2], SELF_STOP] as Array<
  [number, number, number]
>
const servedArrival = [...sharedArrival, [9, 1.28, 7.2], SERVED_STOP] as Array<
  [number, number, number]
>

const attendant = (
  position: [number, number, number],
  lookAt: [number, number, number],
  action: JourneyActorCue['action'],
): JourneyActorCue => ({ type: 'attendant', position, lookAt, action })

const arrivalSteps = (
  prefix: 'self' | 'served',
  stop: [number, number, number],
  withAttendant = false,
): JourneyStep[] => {
  const actor = withAttendant
    ? attendant(ATTENDANT_WAIT, [5, 1.2, 7.2], 'wait')
    : undefined
  return [
    {
      id: `${prefix}-start`,
      label: 'Avvicinamento sulla strada',
      position: sharedArrival[0]!,
      gazeTarget: [-20, 1.28, 19.5],
      duration: 4,
      cameraMode: 'vehicle',
      motion: 'drive',
      actor,
    },
    {
      id: `${prefix}-road`,
      label: 'Ingresso dal varco carrabile',
      position: [6, 1.28, 19.4],
      gazeTarget: [16, 1.3, 18],
      duration: 6,
      cameraMode: 'vehicle',
      motion: 'drive',
      mediaPointId: 'mp-09',
      actor,
    },
    {
      id: `${prefix}-entry`,
      label: 'Curva continua nel piazzale',
      position: [19, 1.28, 13],
      gazeTarget: [18, 1.3, 8.5],
      duration: 5,
      cameraMode: 'vehicle',
      motion: 'drive',
      actor,
    },
    {
      id: `${prefix}-align`,
      label: `Allineamento alla corsia ${prefix === 'self' ? 'Self' : 'Servito'}`,
      position: prefix === 'self' ? [7, 1.28, 7.2] : [9, 1.28, 7.2],
      gazeTarget: prefix === 'self' ? [-2, 1.3, 7.2] : [3, 1.3, 7.2],
      duration: 4,
      cameraMode: 'vehicle',
      motion: 'drive',
      mediaPointId: 'mp-10',
      actor,
    },
    {
      id: `${prefix}-brake`,
      label: 'Frenata progressiva in parallelo',
      position: stop,
      gazeTarget: [stop[0] - 8, 1.3, 7.2],
      duration: 3,
      cameraMode: 'vehicle',
      motion: 'brake',
      vehicleYaw: WESTBOUND,
      actor,
    },
  ]
}

export const STATION_JOURNEYS: StationJourney[] = [
  {
    id: 'self-service',
    name: 'Rifornimento Self',
    description:
      'Ingresso dal varco carrabile, pagamento al terminale, rifornimento presidiato e rientro in auto.',
    arrivalPath: selfArrival,
    arrivalEndStepId: 'self-brake',
    steps: [
      ...arrivalSteps('self', SELF_STOP),
      {
        id: 'self-check-pump',
        label: 'Controllo rapido dell’erogatore',
        position: SELF_STOP,
        gazeTarget: [-5, 1.55, 3.25],
        duration: 1.8,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-01',
      },
      {
        id: 'self-exit',
        label: 'Uscita dal lato conducente',
        position: [-5, 1.69, 8.65],
        gazeTarget: [-8.3, 1.35, 8.3],
        duration: 2.5,
        cameraMode: 'pedestrian',
        motion: 'exit',
      },
      {
        id: 'self-around-car',
        label: 'Passaggio davanti all’auto',
        position: [-8.4, 1.69, 8.65],
        gazeTarget: [-8.4, 1.45, 4.5],
        duration: 3,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'self-walk-terminal-1',
        label: 'Cammino nella fascia libera',
        position: [-8.4, 1.69, 4.55],
        gazeTarget: [-10, 1.5, 2.5],
        duration: 3.2,
        cameraMode: 'pedestrian',
        motion: 'walk',
        mediaPointId: 'mp-10',
      },
      {
        id: 'self-walk-terminal-2',
        label: 'Arrivo al terminale Self',
        position: [-11.15, 1.69, 0.25],
        gazeTarget: [-11.5, 1.45, -0.86],
        duration: 4.2,
        cameraMode: 'pedestrian',
        motion: 'walk',
        mediaPointId: 'mp-05',
      },
      {
        id: 'self-payment',
        label: 'Pagamento e autorizzazione',
        position: [-11.15, 1.69, 0.25],
        gazeTarget: [-11.5, 1.43, -0.86],
        duration: 8,
        cameraMode: 'pedestrian',
        motion: 'hold',
        mediaPointId: 'mp-05',
        dwellSeconds: 8,
      },
      {
        id: 'self-return-pump-1',
        label: 'Ritorno verso l’isola',
        position: [-9.9, 1.69, 2.55],
        gazeTarget: [-8.2, 1.35, 4.4],
        duration: 2.5,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'self-return-pump-2',
        label: 'Percorso esterno alla pompa',
        position: [-7.3, 1.69, 4.35],
        gazeTarget: [-5.4, 1.25, 4.25],
        duration: 3,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'self-take-nozzle',
        label: 'Presa della pistola',
        position: [-5.4, 1.69, 4.25],
        gazeTarget: [-5, 1.15, 3.35],
        duration: 3,
        cameraMode: 'pedestrian',
        motion: 'glance',
        mediaPointId: 'mp-02',
      },
      {
        id: 'self-insert-nozzle',
        label: 'Inserimento nel bocchettone',
        position: [-3.6, 1.69, 5.75],
        gazeTarget: [-3.2, 1.05, 6.3],
        duration: 3.5,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'self-refuel',
        label: 'Rifornimento presidiato',
        position: [-3.6, 1.69, 5.75],
        gazeTarget: [-3.2, 1.05, 6.3],
        duration: 30,
        cameraMode: 'pedestrian',
        motion: 'hold',
        dwellSeconds: 30,
      },
      {
        id: 'self-refuel-check',
        label: 'Controllo dell’erogatore',
        position: [-3.6, 1.69, 5.75],
        gazeTarget: [-5, 1.45, 3.25],
        duration: 8,
        cameraMode: 'pedestrian',
        motion: 'glance',
        mediaPointId: 'mp-01',
        dwellSeconds: 8,
      },
      {
        id: 'self-refuel-observe',
        label: 'Breve osservazione nel campo sicuro',
        position: [-3.6, 1.69, 5.75],
        gazeTarget: [1.2, 2, 2.6],
        duration: 10,
        cameraMode: 'pedestrian',
        motion: 'glance',
        mediaPointId: 'mp-03',
        dwellSeconds: 10,
      },
      {
        id: 'self-remove-nozzle',
        label: 'Estrazione della pistola',
        position: [-3.6, 1.69, 5.75],
        gazeTarget: [-3.2, 1.05, 6.3],
        duration: 2.5,
        cameraMode: 'pedestrian',
        motion: 'glance',
      },
      {
        id: 'self-replace-nozzle',
        label: 'Riaggancio della pistola',
        position: [-5.4, 1.69, 4.25],
        gazeTarget: [-5, 1.15, 3.35],
        duration: 3,
        cameraMode: 'pedestrian',
        motion: 'walk',
        mediaPointId: 'mp-02',
      },
      {
        id: 'self-return-car-1',
        label: 'Ritorno attorno al frontale',
        position: [-8.25, 1.69, 6.05],
        gazeTarget: [-8.4, 1.4, 8.65],
        duration: 3.5,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'self-return-car-around',
        label: 'Passaggio esterno alla carrozzeria',
        position: [-8.4, 1.69, 8.65],
        gazeTarget: [-5, 1.4, 8.65],
        duration: 2.2,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'self-return-car-2',
        label: 'Raggiungimento della portiera',
        position: [-5, 1.69, 8.65],
        gazeTarget: [-5, 1.2, 7.2],
        duration: 3,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'self-enter-car',
        label: 'Rientro nell’abitacolo',
        position: SELF_STOP,
        gazeTarget: [-13, 1.3, 7.2],
        duration: 2.5,
        cameraMode: 'vehicle',
        motion: 'enter',
        vehicleYaw: WESTBOUND,
      },
      {
        id: 'self-finish',
        label: 'Journey completata',
        position: SELF_STOP,
        gazeTarget: [-13, 1.3, 7.2],
        duration: 1.5,
        cameraMode: 'vehicle',
        motion: 'hold',
        vehicleYaw: WESTBOUND,
      },
    ],
  },
  {
    id: 'servito',
    name: 'Rifornimento Servito',
    description:
      'Ingresso in corsia, pagamento laterale e attesa in auto mentre l’operatore effettua il servizio.',
    arrivalPath: servedArrival,
    arrivalEndStepId: 'served-brake',
    steps: [
      ...arrivalSteps('served', SERVED_STOP, true),
      {
        id: 'served-settle',
        label: 'Arresto nella corsia assistita',
        position: SERVED_STOP,
        gazeTarget: [5, 1.5, 5.75],
        duration: 2,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-02',
        actor: attendant([8.2, 0, 5.65], [5, 1.2, 7.2], 'approach'),
      },
      {
        id: 'served-window',
        label: 'L’operatore raggiunge il finestrino laterale',
        position: SERVED_STOP,
        gazeTarget: [5, 1.42, 5.75],
        duration: 4.5,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        actor: attendant([5, 0, 5.75], [5, 1.2, 7.2], 'approach'),
      },
      {
        id: 'served-payment',
        label: 'Pagamento dal finestrino',
        position: SERVED_STOP,
        gazeTarget: [5, 1.2, 5.75],
        duration: 8,
        cameraMode: 'vehicle',
        motion: 'hold',
        vehicleYaw: WESTBOUND,
        actor: attendant([5, 0, 5.75], [5, 1.2, 7.2], 'payment'),
      },
      {
        id: 'served-clear-support',
        label: 'Passaggio esterno al supporto',
        position: SERVED_STOP,
        gazeTarget: [1, 1.5, 7.2],
        duration: 2.5,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-03',
        actor: attendant([7.5, 0, 5.75], [5, 1.15, 3.35], 'approach'),
      },
      {
        id: 'served-around-pump',
        label: 'L’operatore aggira l’isola',
        position: SERVED_STOP,
        gazeTarget: [1, 1.5, 7.2],
        duration: 3.5,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-03',
        actor: attendant([7.5, 0, 4.35], [5, 1.15, 3.35], 'approach'),
      },
      {
        id: 'served-take-nozzle',
        label: 'Presa della pistola',
        position: SERVED_STOP,
        gazeTarget: [0, 1.5, 7.2],
        duration: 2.5,
        cameraMode: 'vehicle',
        motion: 'hold',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-01',
        actor: attendant([6.55, 0, 4.25], [5, 1.15, 3.35], 'take-nozzle'),
      },
      {
        id: 'served-insert-nozzle',
        label: 'Inserimento nel bocchettone',
        position: SERVED_STOP,
        gazeTarget: [-1, 1.45, 7.2],
        duration: 3,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        actor: attendant([7.4, 0, 5.75], [7.1, 1.05, 6.3], 'refuel'),
      },
      {
        id: 'served-refuel',
        label: 'Attesa in abitacolo',
        position: SERVED_STOP,
        gazeTarget: [-4, 1.55, 4.6],
        duration: 30,
        cameraMode: 'vehicle',
        motion: 'hold',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-01',
        dwellSeconds: 30,
        actor: attendant([7.4, 0, 5.75], [7.1, 1.05, 6.3], 'refuel'),
      },
      {
        id: 'served-look-shop',
        label: 'Osservazione naturale dal parabrezza',
        position: SERVED_STOP,
        gazeTarget: [-2, 1.7, -1],
        duration: 10,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-03',
        dwellSeconds: 10,
        actor: attendant([7.4, 0, 5.75], [7.1, 1.05, 6.3], 'refuel'),
      },
      {
        id: 'served-look-side',
        label: 'Breve sguardo laterale ai supporti',
        position: SERVED_STOP,
        gazeTarget: [14, 1.5, -1.5],
        duration: 8,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-06',
        dwellSeconds: 8,
        actor: attendant([7.4, 0, 5.75], [7.1, 1.05, 6.3], 'refuel'),
      },
      {
        id: 'served-replace-nozzle',
        label: 'Chiusura del rifornimento',
        position: SERVED_STOP,
        gazeTarget: [-3, 1.4, 7.2],
        duration: 3,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        actor: attendant([6.55, 0, 4.25], [5, 1.15, 3.35], 'replace-nozzle'),
      },
      {
        id: 'served-return-window',
        label: 'Uscita dalla zona dell’erogatore',
        position: SERVED_STOP,
        gazeTarget: [1, 1.4, 7.2],
        duration: 2.5,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        actor: attendant([7.5, 0, 5.75], [5, 1.2, 7.2], 'return'),
      },
      {
        id: 'served-return-window-side',
        label: 'Ritorno laterale dell’operatore',
        position: SERVED_STOP,
        gazeTarget: [5, 1.4, 5.75],
        duration: 3.5,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        actor: attendant([5, 0, 5.75], [5, 1.2, 7.2], 'return'),
      },
      {
        id: 'served-finish',
        label: 'Conferma e saluto',
        position: SERVED_STOP,
        gazeTarget: [5, 1.2, 5.75],
        duration: 3,
        cameraMode: 'vehicle',
        motion: 'hold',
        vehicleYaw: WESTBOUND,
        actor: attendant([5, 0, 5.75], [5, 1.2, 7.2], 'return'),
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
