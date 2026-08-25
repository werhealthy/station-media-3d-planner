export type JourneyId = 'servito' | 'self-service' | 'self-svolta'

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
  arrivalPath: Array<[number, number, number]>
  arrivalEndStepId: string
  parkedVehicle?: {
    position: [number, number, number]
    yaw: number
  }
  steps: JourneyStep[]
}

const WESTBOUND = Math.PI / 2
const SELF_STOP: [number, number, number] = [-4.6, 1.28, 5.6]
const SERVED_STOP: [number, number, number] = [4.6, 1.28, 5.6]
const ATTENDANT_WAIT: [number, number, number] = [8.5, 0, 3.2]

const sharedArrival: Array<[number, number, number]> = [
  [-29, 1.28, 19],
  [-21, 1.28, 19],
  [-10, 1.28, 19],
  [4, 1.28, 19],
  [13, 1.28, 18.2],
  [18, 1.28, 15.5],
  [19, 1.28, 12],
  [17.5, 1.28, 8.5],
  [13, 1.28, 6.3],
  [9, 1.28, 5.6],
]

const selfArrival = [...sharedArrival, [0, 1.28, 5.6], SELF_STOP] as Array<
  [number, number, number]
>
const servedArrival = [...sharedArrival, SERVED_STOP] as Array<
  [number, number, number]
>

const attendant = (
  position: [number, number, number],
  lookAt: [number, number, number],
  action: JourneyActorCue['action'],
): JourneyActorCue => ({ type: 'attendant', position, lookAt, action })

function arrivalSteps(
  prefix: 'served' | 'self' | 'svolta',
  stop: [number, number, number],
  withAttendant = false,
): JourneyStep[] {
  const actor = withAttendant
    ? attendant(ATTENDANT_WAIT, [4.6, 1.2, 5.6], 'wait')
    : undefined
  return [
    {
      id: `${prefix}-start`,
      label: 'Individuazione Q8 e prezzi',
      position: sharedArrival[0]!,
      gazeTarget: [-18, 4.4, 10.4],
      duration: 3.5,
      cameraMode: 'vehicle',
      motion: 'drive',
      mediaPointId: 'mp-08',
      actor,
    },
    {
      id: `${prefix}-hook`,
      label: 'Stendardo e Beach Flag',
      position: [-8, 1.28, 19],
      gazeTarget: [-14.5, 1.8, 10.6],
      duration: 4.5,
      cameraMode: 'vehicle',
      motion: 'drive',
      mediaPointId: 'mp-09',
      actor,
    },
    {
      id: `${prefix}-entry`,
      label: 'Ingresso dal varco carrabile',
      position: [14, 1.28, 17.5],
      gazeTarget: [18, 1.3, 11],
      duration: 5,
      cameraMode: 'vehicle',
      motion: 'drive',
      actor,
    },
    {
      id: `${prefix}-choice`,
      label: 'Differenziale e scelta modalità',
      position: [17, 1.28, 8],
      gazeTarget: [12.8, 1.2, 10.4],
      duration: 4,
      cameraMode: 'vehicle',
      motion: 'drive',
      mediaPointId: 'mp-10',
      actor,
    },
    {
      id: `${prefix}-align`,
      label: 'Pump Leader e scelta erogatore',
      position: [8.5, 1.28, 5.6],
      gazeTarget: [-4.6, 0.85, 3.95],
      duration: 4,
      cameraMode: 'vehicle',
      motion: 'drive',
      mediaPointId: 'mp-02',
      actor,
    },
    {
      id: `${prefix}-brake`,
      label: 'Accostamento parallelo alla pompa',
      position: stop,
      gazeTarget: [stop[0] - 7, 1.3, stop[2]],
      duration: 3,
      cameraMode: 'vehicle',
      motion: 'brake',
      vehicleYaw: WESTBOUND,
      actor,
    },
  ]
}

function selfFuelSteps(prefix: 'self' | 'svolta'): JourneyStep[] {
  return [
    {
      id: `${prefix}-approach-nozzle`,
      label: 'Avvicinamento esterno al supporto',
      position: [-2.2, 1.69, 3.05],
      gazeTarget: [-4.6, 1.2, 2.55],
      duration: 2.2,
      cameraMode: 'pedestrian',
      motion: 'walk',
      mediaPointId: 'mp-02',
    },
    {
      id: `${prefix}-take-nozzle`,
      label: 'Presa della pistola',
      position: [-4.9, 1.69, 3.05],
      gazeTarget: [-4.6, 1.2, 2.55],
      duration: 3,
      cameraMode: 'pedestrian',
      motion: 'glance',
      mediaPointId: 'mp-02',
    },
    {
      id: `${prefix}-clear-pump-leader`,
      label: 'Passaggio esterno al Pump Leader',
      position: [-2.2, 1.69, 3.05],
      gazeTarget: [-2.35, 1.05, 4.75],
      duration: 2.2,
      cameraMode: 'pedestrian',
      motion: 'walk',
      mediaPointId: 'mp-02',
    },
    {
      id: `${prefix}-insert-nozzle`,
      label: 'Inserimento nel bocchettone',
      position: [-1.9, 1.69, 4.2],
      gazeTarget: [-2.35, 1.05, 4.75],
      duration: 3.5,
      cameraMode: 'pedestrian',
      motion: 'walk',
    },
    {
      id: `${prefix}-refuel`,
      label: 'Rifornimento presidiato',
      position: [-1.9, 1.69, 4.2],
      gazeTarget: [-2.35, 1.05, 4.75],
      duration: 30,
      cameraMode: 'pedestrian',
      motion: 'hold',
      dwellSeconds: 30,
    },
    {
      id: `${prefix}-refuel-pump-ear`,
      label: 'Secondo contatto con la triade',
      position: [-1.9, 1.69, 4.2],
      gazeTarget: [3.68, 1.45, 2.09],
      duration: 8,
      cameraMode: 'pedestrian',
      motion: 'glance',
      mediaPointId: 'mp-04',
      dwellSeconds: 8,
    },
    {
      id: `${prefix}-refuel-column`,
      label: 'Lettura Pannello Colonna',
      position: [-1.9, 1.69, 4.2],
      gazeTarget: [6.4, 2.1, -0.86],
      duration: 10,
      cameraMode: 'pedestrian',
      motion: 'glance',
      mediaPointId: 'mp-03',
      dwellSeconds: 10,
    },
    {
      id: `${prefix}-remove-nozzle`,
      label: 'Fine erogazione',
      position: [-1.9, 1.69, 4.2],
      gazeTarget: [-2.35, 1.05, 4.75],
      duration: 2.5,
      cameraMode: 'pedestrian',
      motion: 'glance',
    },
    {
      id: `${prefix}-clear-pump-leader-return`,
      label: 'Ritorno esterno al Pump Leader',
      position: [-2.2, 1.69, 3.05],
      gazeTarget: [-4.6, 1.2, 2.55],
      duration: 2.2,
      cameraMode: 'pedestrian',
      motion: 'walk',
      mediaPointId: 'mp-02',
    },
    {
      id: `${prefix}-replace-nozzle`,
      label: 'Riaggancio della pistola',
      position: [-4.9, 1.69, 3.05],
      gazeTarget: [-4.6, 1.2, 2.55],
      duration: 3,
      cameraMode: 'pedestrian',
      motion: 'walk',
      mediaPointId: 'mp-01',
    },
    {
      id: `${prefix}-clear-support-left`,
      label: 'Uscita laterale dall’isola',
      position: [-7.3, 1.69, 3.05],
      gazeTarget: [-7.3, 1.4, 4],
      duration: 2.5,
      cameraMode: 'pedestrian',
      motion: 'walk',
    },
    {
      id: `${prefix}-return-car-front`,
      label: 'Ritorno esterno all’isola',
      position: [-7.3, 1.69, 4],
      gazeTarget: [-7.3, 1.4, 7],
      duration: 3,
      cameraMode: 'pedestrian',
      motion: 'walk',
      mediaPointId: 'mp-07',
    },
    {
      id: `${prefix}-return-car-side`,
      label: 'Raggiungimento della portiera',
      position: [-7.3, 1.69, 7],
      gazeTarget: [-4.6, 1.3, 7],
      duration: 2.5,
      cameraMode: 'pedestrian',
      motion: 'walk',
    },
    {
      id: `${prefix}-return-car`,
      label: 'Rientro dal lato conducente',
      position: [-4.6, 1.69, 7],
      gazeTarget: [-4.6, 1.2, 5.6],
      duration: 2.5,
      cameraMode: 'pedestrian',
      motion: 'walk',
    },
    {
      id: `${prefix}-enter-car`,
      label: 'Rientro nell’abitacolo',
      position: SELF_STOP,
      gazeTarget: [-12, 1.3, 5.6],
      duration: 2.5,
      cameraMode: 'vehicle',
      motion: 'enter',
      vehicleYaw: WESTBOUND,
    },
    {
      id: `${prefix}-finish`,
      label: 'Journey completata',
      position: SELF_STOP,
      gazeTarget: [-12, 1.3, 5.6],
      duration: 1.5,
      cameraMode: 'vehicle',
      motion: 'hold',
      vehicleYaw: WESTBOUND,
    },
  ]
}

export const STATION_JOURNEYS: StationJourney[] = [
  {
    id: 'servito',
    name: 'A · Solo Servito',
    description:
      'Il cliente resta in auto: presa in carico, rifornimento, pagamento al gestore e ripartenza.',
    arrivalPath: servedArrival,
    arrivalEndStepId: 'served-brake',
    steps: [
      ...arrivalSteps('served', SERVED_STOP, true),
      {
        id: 'served-settle',
        label: 'Presa in carico del gestore',
        position: SERVED_STOP,
        gazeTarget: [4.6, 1.42, 4.15],
        duration: 3,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-04',
        actor: attendant([7.1, 0, 4.15], [4.6, 1.2, 5.6], 'approach'),
      },
      {
        id: 'served-window',
        label: 'Scelta del carburante al finestrino',
        position: SERVED_STOP,
        gazeTarget: [4.6, 1.3, 4.15],
        duration: 4,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        actor: attendant([4.6, 0, 4.15], [4.6, 1.2, 5.6], 'approach'),
      },
      {
        id: 'served-clear-car',
        label: 'L’operatore aggira l’auto',
        position: SERVED_STOP,
        gazeTarget: [-2, 1.5, 5.6],
        duration: 2.5,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-01',
        actor: attendant([6.9, 0, 4.15], [4.6, 1.15, 2.55], 'approach'),
      },
      {
        id: 'served-around-pump',
        label: 'Avvicinamento esterno all’erogatore',
        position: SERVED_STOP,
        gazeTarget: [-2, 1.5, 5.6],
        duration: 3,
        cameraMode: 'vehicle',
        motion: 'hold',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-03',
        actor: attendant([7.05, 0, 3.05], [4.6, 1.15, 2.55], 'approach'),
      },
      {
        id: 'served-take-nozzle',
        label: 'Presa della pistola',
        position: SERVED_STOP,
        gazeTarget: [-2, 1.5, 5.6],
        duration: 2.5,
        cameraMode: 'vehicle',
        motion: 'hold',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-01',
        actor: attendant([7.05, 0, 2.8], [4.6, 1.15, 2.55], 'take-nozzle'),
      },
      {
        id: 'served-clear-pump',
        label: 'Passaggio esterno all’isola',
        position: SERVED_STOP,
        gazeTarget: [-3, 1.45, 5.6],
        duration: 2,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        actor: attendant([7.05, 0, 3.35], [6.75, 1.05, 4.75], 'take-nozzle'),
      },
      {
        id: 'served-insert-nozzle',
        label: 'Inserimento nel bocchettone',
        position: SERVED_STOP,
        gazeTarget: [-3, 1.45, 5.6],
        duration: 3,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        actor: attendant([6.9, 0, 4.15], [6.75, 1.05, 4.75], 'refuel'),
      },
      {
        id: 'served-refuel',
        label: 'Attesa durante il rifornimento',
        position: SERVED_STOP,
        gazeTarget: [3.68, 1.45, 2.09],
        duration: 30,
        cameraMode: 'vehicle',
        motion: 'hold',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-04',
        dwellSeconds: 30,
        actor: attendant([6.9, 0, 4.15], [6.75, 1.05, 4.75], 'refuel'),
      },
      {
        id: 'served-look-column',
        label: 'Lettura Pannello Colonna',
        position: SERVED_STOP,
        gazeTarget: [6.4, 2.1, -0.86],
        duration: 10,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-03',
        dwellSeconds: 10,
        actor: attendant([6.9, 0, 4.15], [6.75, 1.05, 4.75], 'refuel'),
      },
      {
        id: 'served-look-topper',
        label: 'Lettura Sovrapompa',
        position: SERVED_STOP,
        gazeTarget: [4.6, 2.36, 2.08],
        duration: 8,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-01',
        dwellSeconds: 8,
        actor: attendant([6.9, 0, 4.15], [6.75, 1.05, 4.75], 'refuel'),
      },
      {
        id: 'served-clear-pump-return',
        label: 'Ritorno esterno all’isola',
        position: SERVED_STOP,
        gazeTarget: [-3, 1.4, 5.6],
        duration: 2,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        actor: attendant([7.05, 0, 3.35], [4.6, 1.15, 2.55], 'return'),
      },
      {
        id: 'served-replace-nozzle',
        label: 'Chiusura del rifornimento',
        position: SERVED_STOP,
        gazeTarget: [-3, 1.4, 5.6],
        duration: 3,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        actor: attendant([7.05, 0, 2.8], [4.6, 1.15, 2.55], 'replace-nozzle'),
      },
      {
        id: 'served-return-side',
        label: 'Ritorno esterno alla pompa',
        position: SERVED_STOP,
        gazeTarget: [-3, 1.4, 5.6],
        duration: 2.5,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        actor: attendant([6.9, 0, 4.15], [4.6, 1.2, 5.6], 'return'),
      },
      {
        id: 'served-return-window',
        label: 'Pagamento al gestore',
        position: SERVED_STOP,
        gazeTarget: [4.6, 1.25, 4.15],
        duration: 8,
        cameraMode: 'vehicle',
        motion: 'hold',
        vehicleYaw: WESTBOUND,
        actor: attendant([4.6, 0, 4.15], [4.6, 1.2, 5.6], 'payment'),
      },
      {
        id: 'served-finish',
        label: 'Saluto e ripartenza',
        position: SERVED_STOP,
        gazeTarget: [-8.6, 1.85, -4.28],
        duration: 3,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-07',
        actor: attendant([4.6, 0, 4.15], [4.6, 1.2, 5.6], 'return'),
      },
    ],
  },
  {
    id: 'self-service',
    name: 'B · Self con accettatore',
    description:
      'Loop fisico pompa → accettatore digitale → pompa, con doppia esposizione alla triade.',
    arrivalPath: selfArrival,
    arrivalEndStepId: 'self-brake',
    parkedVehicle: { position: [-4.6, 0, 5.6], yaw: WESTBOUND },
    steps: [
      ...arrivalSteps('self', SELF_STOP),
      {
        id: 'self-check-pump',
        label: 'Primo contatto con la triade',
        position: SELF_STOP,
        gazeTarget: [-4.6, 1.3, 2.55],
        duration: 2,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-01',
      },
      {
        id: 'self-exit',
        label: 'Uscita dal lato conducente',
        position: [-4.6, 1.69, 7],
        gazeTarget: [-7.3, 1.4, 7],
        duration: 2.5,
        cameraMode: 'pedestrian',
        motion: 'exit',
      },
      {
        id: 'self-around-car',
        label: 'Orientamento verso l’accettatore',
        position: [-7.3, 1.69, 7],
        gazeTarget: [-7.3, 1.45, 3.2],
        duration: 2.8,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'self-walk-terminal',
        label: 'Cammino verso il DSP in idle',
        position: [-7.3, 1.69, 3.2],
        gazeTarget: [-9, 1.5, 0.3],
        duration: 3.2,
        cameraMode: 'pedestrian',
        motion: 'walk',
        mediaPointId: 'mp-05',
      },
      {
        id: 'self-terminal',
        label: 'Identificazione dell’erogatore',
        position: [-9, 1.69, 1.4],
        gazeTarget: [-9, 1.5, 0.3],
        duration: 3,
        cameraMode: 'pedestrian',
        motion: 'glance',
        mediaPointId: 'mp-05',
      },
      {
        id: 'self-payment',
        label: 'Pagamento all’accettatore',
        position: [-9, 1.69, 1.4],
        gazeTarget: [-9, 1.45, 0.3],
        duration: 8,
        cameraMode: 'pedestrian',
        motion: 'hold',
        mediaPointId: 'mp-05',
        dwellSeconds: 8,
      },
      {
        id: 'self-return-terminal',
        label: 'Chiusura transazione e ritorno',
        position: [-7.3, 1.69, 3.2],
        gazeTarget: [-4.9, 1.3, 3.05],
        duration: 3,
        cameraMode: 'pedestrian',
        motion: 'walk',
        mediaPointId: 'mp-01',
      },
      ...selfFuelSteps('self'),
    ],
  },
  {
    id: 'self-svolta',
    name: 'C · Self con pagamento in Svolta',
    description:
      'Loop pompa → Svolta → pompa, con esposizione dedicata a Sagomato e Fondostazione.',
    arrivalPath: selfArrival,
    arrivalEndStepId: 'svolta-brake',
    parkedVehicle: { position: [-4.6, 0, 5.6], yaw: WESTBOUND },
    steps: [
      ...arrivalSteps('svolta', SELF_STOP),
      {
        id: 'svolta-check-pump',
        label: 'Primo contatto con la triade',
        position: SELF_STOP,
        gazeTarget: [-4.6, 1.3, 2.55],
        duration: 2,
        cameraMode: 'vehicle',
        motion: 'glance',
        vehicleYaw: WESTBOUND,
        mediaPointId: 'mp-01',
      },
      {
        id: 'svolta-exit',
        label: 'Uscita dal lato conducente',
        position: [-4.6, 1.69, 7],
        gazeTarget: [-1.9, 1.4, 7],
        duration: 2.5,
        cameraMode: 'pedestrian',
        motion: 'exit',
      },
      {
        id: 'svolta-clear-car',
        label: 'Orientamento verso Svolta',
        position: [-1.9, 1.69, 7],
        gazeTarget: [0, 1.45, 4],
        duration: 2.8,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'svolta-center-aisle',
        label: 'Passaggio nella corsia centrale',
        position: [0, 1.69, 4],
        gazeTarget: [0, 1.4, -2.9],
        duration: 3,
        cameraMode: 'pedestrian',
        motion: 'walk',
        mediaPointId: 'mp-07',
      },
      {
        id: 'svolta-behind-pumps',
        label: 'Fondostazione e percorso store',
        position: [0, 1.69, -2.9],
        gazeTarget: [5, 1.6, -3.7],
        duration: 4,
        cameraMode: 'pedestrian',
        motion: 'walk',
        mediaPointId: 'mp-07',
      },
      {
        id: 'svolta-frontage',
        label: 'Avvicinamento allo store',
        position: [4, 1.69, -3.7],
        gazeTarget: [9.5, 1.8, -4.1],
        duration: 3,
        cameraMode: 'pedestrian',
        motion: 'walk',
        mediaPointId: 'mp-06',
      },
      {
        id: 'svolta-entrance',
        label: 'Sagomato e ingresso Svolta',
        position: [9.5, 1.69, -3.7],
        gazeTarget: [14.7, 1.05, -4.02],
        duration: 4,
        cameraMode: 'pedestrian',
        motion: 'glance',
        mediaPointId: 'mp-06',
        dwellSeconds: 4,
      },
      {
        id: 'svolta-enter-store',
        label: 'Ingresso nello store',
        position: [9.5, 1.69, -5.6],
        gazeTarget: [10.3, 1.35, -7.7],
        duration: 2.5,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'svolta-counter',
        label: 'Raggiungimento della cassa',
        position: [10.3, 1.69, -7.7],
        gazeTarget: [11.45, 1.2, -8.2],
        duration: 3,
        cameraMode: 'pedestrian',
        motion: 'walk',
      },
      {
        id: 'svolta-payment',
        label: 'Pagamento in Svolta',
        position: [10.3, 1.69, -7.7],
        gazeTarget: [11.45, 1.2, -8.2],
        duration: 8,
        cameraMode: 'pedestrian',
        motion: 'hold',
        dwellSeconds: 8,
      },
      {
        id: 'svolta-exit-store',
        label: 'Uscita dallo store',
        position: [9.5, 1.69, -3.7],
        gazeTarget: [4, 1.4, -3.7],
        duration: 4,
        cameraMode: 'pedestrian',
        motion: 'walk',
        mediaPointId: 'mp-06',
      },
      {
        id: 'svolta-return-behind-pumps',
        label: 'Seconda esposizione sul percorso',
        position: [0, 1.69, -2.9],
        gazeTarget: [-8.6, 1.85, -4.28],
        duration: 5,
        cameraMode: 'pedestrian',
        motion: 'walk',
        mediaPointId: 'mp-07',
      },
      {
        id: 'svolta-return-center',
        label: 'Ritorno all’erogatore',
        position: [0, 1.69, 4],
        gazeTarget: [-4.9, 1.3, 3.05],
        duration: 4,
        cameraMode: 'pedestrian',
        motion: 'walk',
        mediaPointId: 'mp-01',
      },
      ...selfFuelSteps('svolta'),
    ],
  },
]

export function getJourney(id: string | null | undefined): StationJourney {
  return (
    STATION_JOURNEYS.find((journey) => journey.id === id) ??
    STATION_JOURNEYS.find((journey) => journey.id === 'self-service')!
  )
}

export function journeyDuration(journey: StationJourney): number {
  return journey.steps.reduce((total, step) => total + step.duration, 0)
}
