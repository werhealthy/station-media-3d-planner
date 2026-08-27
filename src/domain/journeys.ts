import { STATION_LAYOUT as L } from './stationLayout'

export type JourneyId = 'servito' | 'self-service' | 'servito-svolta'

export type JourneyMotion =
  'drive' | 'brake' | 'exit' | 'enter' | 'walk' | 'glance' | 'hold'

export type JourneyDecision = 'service-mode' | 'operator-payment'

export type SmartOptScreen =
  | 'idle'
  | 'payback'
  | 'pump'
  | 'fuel'
  | 'payment-method'
  | 'cash-instructions'
  | 'cash-amount'
  | 'review'
  | 'confirmed'

export type NozzleState =
  'holstered' | 'hand' | 'inserting' | 'inserted' | 'removing' | 'returning'

export interface JourneyNozzleCue {
  owner: 'driver' | 'attendant'
  pump: 'self' | 'servito'
  state: NozzleState
}

export interface JourneyActorCue {
  type: 'attendant'
  position: [number, number, number]
  lookAt: [number, number, number]
  action:
    | 'wait'
    | 'approach'
    | 'payment'
    | 'take-nozzle'
    | 'carry-nozzle'
    | 'insert-nozzle'
    | 'refuel'
    | 'remove-nozzle'
    | 'replace-nozzle'
    | 'return'
}

export interface JourneyStep {
  id: string
  phase: string
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
  decision?: JourneyDecision
  terminalScreen?: SmartOptScreen
  nozzle?: JourneyNozzleCue
  checkpoint?: string
  /**
   * Nasconde con un breve nero i cambi di assetto che il prototipo non può
   * ancora animare in modo credibile (auto/persona e soglie dello store).
   */
  cameraTransition?: 'fade-cut' | 'character-cut'
}

export interface StationJourney {
  id: JourneyId
  name: string
  description: string
  arrivalPath: Array<[number, number, number]>
  arrivalEndStepId: string
  departurePath: Array<[number, number, number]>
  departureStartStepId: string
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
  [34, 1.28, 16.45],
  [30, 1.28, 16.45],
  [26, 1.28, 16.45],
  [22.2, 1.28, 16.25],
  [19.1, 1.28, 15.25],
  [16.85, 1.28, 13.25],
  [15.35, 1.28, 10.45],
  [14.65, 1.28, 7.9],
  [12.8, 1.28, 6.15],
  [9, 1.28, 5.6],
]

const selfArrival = [...sharedArrival, [0, 1.28, 5.6], SELF_STOP] as Array<
  [number, number, number]
>
const servedArrival = [...sharedArrival, SERVED_STOP] as Array<
  [number, number, number]
>

const selfDeparture: Array<[number, number, number]> = [
  SELF_STOP,
  [-7.5, 1.28, 5.7],
  [-10.8, 1.28, 6.7],
  [-13.4, 1.28, 8.8],
  [-15.1, 1.28, 11.5],
  [-15.5, 1.28, 14.2],
  [-16.4, 1.28, 16.05],
  [-20, 1.28, 16.45],
  [-30, 1.28, 16.45],
]
const servedDeparture: Array<[number, number, number]> = [
  SERVED_STOP,
  [1.2, 1.28, 5.65],
  ...selfDeparture.slice(1),
]

const attendant = (
  position: [number, number, number],
  lookAt: [number, number, number],
  action: JourneyActorCue['action'],
): JourneyActorCue => ({ type: 'attendant', position, lookAt, action })

function commonArrivalSteps(
  service: 'self' | 'servito',
  stop: [number, number, number],
): JourneyStep[] {
  const waitingOperator =
    service === 'servito'
      ? attendant(ATTENDANT_WAIT, SERVED_STOP, 'wait')
      : undefined
  return [
    {
      id: 'common-station',
      phase: 'Ingresso · Individuazione della stazione',
      label:
        'Riconosce Q8 e controlla i prezzi senza distogliersi dalla strada',
      position: sharedArrival[0]!,
      gazeTarget: [L.totem.x, 4.4, L.totem.z],
      duration: 4.5,
      cameraMode: 'vehicle',
      motion: 'drive',
      checkpoint: 'Ingresso dalla corsia destra',
      actor: waitingOperator,
    },
    {
      id: 'common-beach-flag',
      phase: 'Ingresso · Primo aggancio comunicativo',
      label: 'La Beach Flag apre la sequenza mentre prepara la svolta',
      position: [29, 1.28, 19],
      gazeTarget: [L.entry.beachFlagX, 2.15, L.entry.beachFlagZ],
      duration: 4,
      cameraMode: 'vehicle',
      motion: 'drive',
      mediaPointId: 'mp-09',
      actor: waitingOperator,
    },
    {
      id: 'common-stendardo',
      phase: 'Ingresso · Rafforzamento dell’hook',
      label: 'Lo Stendardo conferma il messaggio prima dell’ingresso',
      position: [26, 1.28, 18.9],
      gazeTarget: [L.entry.stendardoX, 2.9, L.entry.stendardoZ],
      duration: 4,
      cameraMode: 'vehicle',
      motion: 'drive',
      mediaPointId: 'mp-08',
      actor: waitingOperator,
    },
    {
      id: 'common-open',
      phase: 'Ingresso · Conferma operatività',
      label: 'Controlla rapidamente che la stazione sia operativa',
      position: [22.8, 1.28, 18.1],
      gazeTarget: [15, 1.4, 13.2],
      duration: 3,
      cameraMode: 'vehicle',
      motion: 'drive',
      actor: waitingOperator,
    },
    {
      id: 'common-standard-sign',
      phase: 'Ingresso · Orientamento sul piazzale',
      label: 'Il Sagomato Standard accompagna la svolta verso le pompe',
      position: [16.4, 1.28, 10.2],
      gazeTarget: [L.entry.standardSignX, 1.45, L.entry.standardSignZ],
      duration: 2.6,
      cameraMode: 'vehicle',
      motion: 'drive',
      mediaPointId: 'mp-06',
      actor: waitingOperator,
    },
    {
      id: 'common-service-choice',
      phase: 'Ingresso · Scelta modalità di servizio',
      label: 'Sceglie Self o Servito prima di incanalarsi',
      position: [18.6, 1.28, 13.3],
      gazeTarget: [14, 1.25, 8],
      duration: 0.6,
      cameraMode: 'vehicle',
      motion: 'hold',
      decision: 'service-mode',
      actor: waitingOperator,
    },
    {
      id: `${service}-island`,
      phase:
        service === 'servito'
          ? 'A1 · Accostamento all’erogatore Servito'
          : 'Self · Accostamento all’erogatore',
      label: 'Individua numero, lato del bocchettone e spazio di manovra',
      position: [9, 1.28, 5.6],
      gazeTarget: service === 'servito' ? [4.6, 1.4, 2.4] : [-4.6, 1.4, 2.4],
      duration: 4.5,
      cameraMode: 'vehicle',
      motion: 'drive',
      mediaPointId: 'mp-02',
      actor: waitingOperator,
    },
    {
      id: `${service}-stop`,
      phase:
        service === 'servito'
          ? 'A1 · Accostamento all’erogatore Servito'
          : 'Self · Accostamento all’erogatore',
      label: 'Completa l’accostamento parallelo alla pompa',
      position: stop,
      gazeTarget: [stop[0] - 7, 1.3, stop[2]],
      duration: 3.5,
      cameraMode: 'vehicle',
      motion: 'brake',
      vehicleYaw: WESTBOUND,
      mediaPointId: 'mp-01',
      checkpoint: 'Auto accostata alla pompa',
      actor: waitingOperator,
    },
  ]
}

function selfFirstContactStep(): JourneyStep {
  return {
    id: 'self-first-contact',
    phase: 'B1 · Accostamento alla pompa Self',
    label: 'Memorizza il numero della pompa; la triade resta periferica',
    position: SELF_STOP,
    gazeTarget: [-4.6, 1.4, 2.55],
    duration: 3,
    cameraMode: 'vehicle',
    motion: 'hold',
    vehicleYaw: WESTBOUND,
    mediaPointId: 'mp-01',
  }
}

function terminalFlowSteps(): JourneyStep[] {
  const position: [number, number, number] = [-9, 1.69, 1.4]
  const gazeTarget: [number, number, number] = [-9, 1.38, 0.3]
  const phase = 'B3 · Identificazione erogatore e pagamento'
  const screenStep = (
    id: string,
    label: string,
    terminalScreen: SmartOptScreen,
    duration: number,
  ): JourneyStep => ({
    id,
    phase,
    label,
    position,
    gazeTarget,
    duration,
    cameraMode: 'pedestrian',
    motion: 'hold',
    mediaPointId: 'mp-05',
    terminalScreen,
  })
  return [
    {
      ...screenStep('self-terminal-start', 'Seleziona Rifornimento', 'idle', 2),
      checkpoint: 'Pagamento al totem',
    },
    screenStep(
      'self-no-payback',
      'Seleziona “No” alla carta PAYBACK',
      'payback',
      2.4,
    ),
    screenStep('self-select-pump', 'Seleziona l’erogatore 1', 'pump', 2.8),
    screenStep(
      'self-select-fuel',
      'Seleziona il tipo di carburante',
      'fuel',
      2.8,
    ),
    screenStep(
      'self-select-payment',
      'Seleziona il metodo di pagamento Contanti',
      'payment-method',
      2.8,
    ),
    screenStep(
      'self-cash-instructions',
      'Segue le istruzioni per inserire le banconote',
      'cash-instructions',
      2.5,
    ),
    screenStep(
      'self-insert-cash',
      'Inserisce le banconote nel terminale',
      'cash-instructions',
      2.5,
    ),
    screenStep(
      'self-cash-amount',
      'Il terminale rileva 50 € inseriti',
      'cash-amount',
      2.4,
    ),
    screenStep('self-review', 'Controlla il riepilogo e conferma', 'review', 3),
    {
      ...screenStep(
        'self-payment-confirmed',
        'Riceve la conferma e può tornare alla pompa',
        'confirmed',
        3.5,
      ),
      phase: 'B4 · Chiusura transazione',
      dwellSeconds: 3.5,
    },
  ]
}

function selfFuelSteps(prefix: 'self' | 'svolta'): JourneyStep[] {
  const contactPhase =
    prefix === 'self'
      ? 'B6 · Ritorno all’erogatore e avvio rifornimento'
      : 'C6 · Ritorno all’erogatore e avvio rifornimento'
  const dwellPhase =
    prefix === 'self'
      ? 'B7 · Dwell time di rifornimento'
      : 'C7 · Dwell time di rifornimento'
  const finishPhase =
    prefix === 'self'
      ? 'B8 · Fine rifornimento e rientro in auto'
      : 'C8 · Fine rifornimento e rientro in auto'
  return [
    {
      id: `${prefix}-approach-rack`,
      phase: contactPhase,
      label: 'Raggiunge la pistola del carburante selezionato',
      position: [-5.65, 1.69, 3.05],
      gazeTarget: [-5.63, 1.33, 2.09],
      duration: 1.8,
      cameraMode: 'pedestrian',
      motion: 'walk',
      mediaPointId: 'mp-01',
      nozzle: { owner: 'driver', pump: 'self', state: 'holstered' },
    },
    {
      id: `${prefix}-take-nozzle`,
      phase: contactPhase,
      label: 'Sgancia la pistola dal supporto',
      position: [-5.65, 1.69, 3.05],
      gazeTarget: [-5.63, 1.33, 2.09],
      duration: 0.45,
      cameraMode: 'pedestrian',
      motion: 'hold',
      nozzle: { owner: 'driver', pump: 'self', state: 'hand' },
    },
    {
      id: `${prefix}-carry-nozzle`,
      phase: contactPhase,
      label: 'Porta la pistola verso il bocchettone senza guardarsi intorno',
      position: [-2.2, 1.69, 3.05],
      gazeTarget: [-3.25, 0.72, 4.75],
      duration: 1.7,
      cameraMode: 'pedestrian',
      motion: 'walk',
      nozzle: { owner: 'driver', pump: 'self', state: 'hand' },
    },
    {
      id: `${prefix}-reach-filler`,
      phase: contactPhase,
      label: 'Si posiziona davanti al bocchettone',
      position: [-1.9, 1.69, 4.2],
      gazeTarget: [-3.25, 0.72, 4.75],
      duration: 1,
      cameraMode: 'pedestrian',
      motion: 'walk',
      nozzle: { owner: 'driver', pump: 'self', state: 'hand' },
    },
    {
      id: `${prefix}-insert-nozzle`,
      phase: contactPhase,
      label: 'Avvicina saldamente la pistola al bocchettone',
      position: [-1.9, 1.69, 4.2],
      gazeTarget: [-3.25, 0.72, 4.75],
      duration: 1.1,
      cameraMode: 'pedestrian',
      motion: 'hold',
      nozzle: { owner: 'driver', pump: 'self', state: 'hand' },
    },
    {
      id: `${prefix}-refuel`,
      phase: dwellPhase,
      label: 'Avvia il rifornimento e controlla l’erogazione',
      position: [-1.9, 1.69, 4.2],
      gazeTarget: [-3.25, 0.72, 4.75],
      duration: 28,
      cameraMode: 'pedestrian',
      motion: 'hold',
      dwellSeconds: 28,
      nozzle: { owner: 'driver', pump: 'self', state: 'hand' },
      checkpoint: 'Rifornimento in corso',
    },
    {
      id: `${prefix}-dwell-column`,
      phase: dwellPhase,
      label: 'Durante l’attesa legge il Pannello Colonna',
      position: [-1.9, 1.69, 4.2],
      gazeTarget: [-3.55, 1.65, 3.45],
      duration: 6,
      cameraMode: 'pedestrian',
      motion: 'glance',
      mediaPointId: 'mp-03',
      dwellSeconds: 6,
      nozzle: { owner: 'driver', pump: 'self', state: 'hand' },
    },
    {
      id: `${prefix}-dwell-triad`,
      phase: dwellPhase,
      label: 'Completa la seconda lettura della triade',
      position: [-1.9, 1.69, 4.2],
      gazeTarget: [-2.55, 1.6, 3.05],
      duration: 5,
      cameraMode: 'pedestrian',
      motion: 'glance',
      mediaPointId: 'mp-04',
      dwellSeconds: 5,
      nozzle: { owner: 'driver', pump: 'self', state: 'hand' },
    },
    {
      id: `${prefix}-remove-nozzle`,
      phase: finishPhase,
      label: 'Conclude l’erogazione mantenendo la pistola in mano',
      position: [-1.9, 1.69, 4.2],
      gazeTarget: [-3.25, 0.72, 4.75],
      duration: 0.45,
      cameraMode: 'pedestrian',
      motion: 'hold',
      nozzle: { owner: 'driver', pump: 'self', state: 'hand' },
    },
    {
      id: `${prefix}-carry-back`,
      phase: finishPhase,
      label: 'Riporta la pistola mantenendo lo sguardo sul percorso',
      position: [-2.2, 1.69, 3.05],
      gazeTarget: [-5.63, 1.33, 2.09],
      duration: 1.5,
      cameraMode: 'pedestrian',
      motion: 'walk',
      nozzle: { owner: 'driver', pump: 'self', state: 'hand' },
    },
    {
      id: `${prefix}-replace-nozzle`,
      phase: finishPhase,
      label: 'Riaggancia immediatamente la pistola al supporto',
      position: [-5.65, 1.69, 3.05],
      gazeTarget: [-5.63, 1.33, 2.09],
      duration: 0.5,
      cameraMode: 'pedestrian',
      motion: 'hold',
      nozzle: { owner: 'driver', pump: 'self', state: 'returning' },
    },
    {
      id: `${prefix}-clear-island`,
      phase: finishPhase,
      label: 'Solo dopo il riaggancio lascia l’isola',
      position: [-7.3, 1.69, 3.05],
      gazeTarget: [-7.3, 1.4, 7],
      duration: 2.8,
      cameraMode: 'pedestrian',
      motion: 'walk',
      nozzle: { owner: 'driver', pump: 'self', state: 'holstered' },
    },
    {
      id: `${prefix}-return-car-side`,
      phase: finishPhase,
      label: 'Raggiunge la portiera dal lato conducente',
      position: [-7.3, 1.69, 7],
      gazeTarget: [-4.6, 1.3, 7],
      duration: 3.2,
      cameraMode: 'pedestrian',
      motion: 'walk',
    },
    {
      id: `${prefix}-return-car`,
      phase: finishPhase,
      label: 'Rientra nell’auto',
      position: [-4.6, 1.69, 7],
      gazeTarget: [-4.6, 1.2, 5.6],
      duration: 2.5,
      cameraMode: 'pedestrian',
      motion: 'walk',
    },
    {
      id: `${prefix}-enter-car`,
      phase: finishPhase,
      label: 'Si risiede al posto guida',
      position: SELF_STOP,
      gazeTarget: [-12, 1.3, 5.6],
      duration: 2.5,
      cameraMode: 'vehicle',
      motion: 'enter',
      vehicleYaw: WESTBOUND,
      cameraTransition: 'character-cut',
    },
  ]
}

function departureSteps(prefix: 'served' | 'self' | 'svolta'): JourneyStep[] {
  const usesServedLane = prefix !== 'self'
  const position = usesServedLane ? SERVED_STOP : SELF_STOP
  const phase =
    prefix === 'served'
      ? 'A5 · Ripartenza'
      : prefix === 'self'
        ? 'B9 · Ripartenza'
        : 'C9 · Ripartenza'
  return [
    {
      id: `${prefix}-departure-start`,
      phase,
      label: 'Controlla la corsia e lascia gradualmente la pompa',
      position,
      gazeTarget: [-15.5, 1.3, 13.2],
      duration: 5,
      cameraMode: 'vehicle',
      motion: 'drive',
      vehicleYaw: WESTBOUND,
      checkpoint: 'Ripartenza verso l’uscita',
    },
    {
      id: `${prefix}-departure-road`,
      phase,
      label: 'Rientra nel flusso stradale guardando davanti a sé',
      position: [-30, 1.28, 16.45],
      gazeTarget: [-40, 1.3, 16.45],
      duration: 8,
      cameraMode: 'vehicle',
      motion: 'drive',
    },
  ]
}

const servedSteps: JourneyStep[] = [
  ...commonArrivalSteps('servito', SERVED_STOP),
  {
    id: 'served-first-contact',
    phase: 'A1 · Accostamento all’erogatore Servito',
    label: 'La triade viene percepita senza competere con la manovra',
    position: SERVED_STOP,
    gazeTarget: [4.6, 1.45, 2.4],
    duration: 3,
    cameraMode: 'vehicle',
    motion: 'hold',
    vehicleYaw: WESTBOUND,
    mediaPointId: 'mp-04',
    actor: attendant(ATTENDANT_WAIT, SERVED_STOP, 'wait'),
  },
  {
    id: 'served-window',
    phase: 'A2 · Presa in carico da parte del gestore',
    label: 'Il gestore raggiunge il finestrino e riceve le indicazioni',
    position: SERVED_STOP,
    gazeTarget: [4.6, 1.3, 4.15],
    duration: 5,
    cameraMode: 'vehicle',
    motion: 'glance',
    vehicleYaw: WESTBOUND,
    mediaPointId: 'mp-03',
    actor: attendant([4.6, 0, 4.15], SERVED_STOP, 'approach'),
    checkpoint: 'Arrivo del gestore',
  },
  {
    id: 'served-around-car',
    phase: 'A3 · Attesa durante il rifornimento',
    label: 'Il gestore aggira l’auto e raggiunge il fronte della pompa',
    position: SERVED_STOP,
    gazeTarget: [0, 1.4, 5.6],
    duration: 2.4,
    cameraMode: 'vehicle',
    motion: 'hold',
    vehicleYaw: WESTBOUND,
    actor: attendant([6.9, 0, 4.15], [3.57, 1.33, 2.09], 'approach'),
  },
  {
    id: 'served-front-pump',
    phase: 'A3 · Attesa durante il rifornimento',
    label: 'Il gestore passa all’esterno dell’isola',
    position: SERVED_STOP,
    gazeTarget: [0, 1.4, 5.6],
    duration: 3,
    cameraMode: 'vehicle',
    motion: 'hold',
    vehicleYaw: WESTBOUND,
    actor: attendant([7.05, 0, 3.05], [3.57, 1.33, 2.09], 'approach'),
  },
  {
    id: 'served-take-nozzle',
    phase: 'A3 · Attesa durante il rifornimento',
    label: 'Il gestore sgancia la pistola selezionata',
    position: SERVED_STOP,
    gazeTarget: [4.6, 1.45, 2.4],
    duration: 2.5,
    cameraMode: 'vehicle',
    motion: 'hold',
    vehicleYaw: WESTBOUND,
    actor: attendant([3.6, 0, 3.15], [3.57, 1.33, 2.09], 'take-nozzle'),
    nozzle: { owner: 'attendant', pump: 'servito', state: 'hand' },
  },
  {
    id: 'served-carry-nozzle',
    phase: 'A3 · Attesa durante il rifornimento',
    label: 'Porta la pistola al bocchettone',
    position: SERVED_STOP,
    gazeTarget: [4.6, 1.45, 2.4],
    duration: 3.2,
    cameraMode: 'vehicle',
    motion: 'hold',
    vehicleYaw: WESTBOUND,
    actor: attendant([7.05, 0, 3.05], [5.95, 0.72, 4.75], 'carry-nozzle'),
    nozzle: { owner: 'attendant', pump: 'servito', state: 'hand' },
  },
  {
    id: 'served-insert-nozzle',
    phase: 'A3 · Attesa durante il rifornimento',
    label: 'Avvicina la pistola al bocchettone mantenendola in mano',
    position: SERVED_STOP,
    gazeTarget: [4.6, 1.45, 2.4],
    duration: 3,
    cameraMode: 'vehicle',
    motion: 'hold',
    vehicleYaw: WESTBOUND,
    actor: attendant([6.45, 0, 4.35], [5.95, 0.72, 4.75], 'insert-nozzle'),
    nozzle: { owner: 'attendant', pump: 'servito', state: 'hand' },
  },
  {
    id: 'served-refuel',
    phase: 'A3 · Attesa durante il rifornimento',
    label: 'Il cliente attende in auto mentre il gestore rifornisce',
    position: SERVED_STOP,
    gazeTarget: [6.32, 1.45, 2.3],
    duration: 30,
    cameraMode: 'vehicle',
    motion: 'hold',
    vehicleYaw: WESTBOUND,
    mediaPointId: 'mp-04',
    dwellSeconds: 30,
    actor: attendant([6.45, 0, 4.35], [5.95, 0.72, 4.75], 'refuel'),
    nozzle: { owner: 'attendant', pump: 'servito', state: 'hand' },
    checkpoint: 'Rifornimento con gestore',
  },
  {
    id: 'served-dwell-column',
    phase: 'A3 · Attesa durante il rifornimento',
    label:
      'Durante l’attesa il Pannello Colonna entra naturalmente nel campo visivo',
    position: SERVED_STOP,
    gazeTarget: [6.4, 2.1, -0.86],
    duration: 6,
    cameraMode: 'vehicle',
    motion: 'glance',
    vehicleYaw: WESTBOUND,
    mediaPointId: 'mp-03',
    dwellSeconds: 6,
    actor: attendant([6.45, 0, 4.35], [5.95, 0.72, 4.75], 'refuel'),
    nozzle: { owner: 'attendant', pump: 'servito', state: 'hand' },
  },
  {
    id: 'served-dwell-topper',
    phase: 'A3 · Attesa durante il rifornimento',
    label: 'Completa la lettura della triade durante il dwell time',
    position: SERVED_STOP,
    gazeTarget: [4.6, 2.82, 2.09],
    duration: 5,
    cameraMode: 'vehicle',
    motion: 'glance',
    vehicleYaw: WESTBOUND,
    mediaPointId: 'mp-01',
    dwellSeconds: 5,
    actor: attendant([6.45, 0, 4.35], [5.95, 0.72, 4.75], 'refuel'),
    nozzle: { owner: 'attendant', pump: 'servito', state: 'hand' },
  },
  {
    id: 'served-dwell-phone',
    phase: 'A3 · Attesa durante il rifornimento',
    label:
      'Durante l’attesa consulta brevemente il telefono, senza perdere il contesto',
    position: SERVED_STOP,
    gazeTarget: [4.55, 0.58, 4.7],
    duration: 5,
    cameraMode: 'vehicle',
    motion: 'glance',
    vehicleYaw: WESTBOUND,
    dwellSeconds: 5,
    actor: attendant([6.45, 0, 4.35], [5.95, 0.72, 4.75], 'refuel'),
    nozzle: { owner: 'attendant', pump: 'servito', state: 'hand' },
  },
  {
    id: 'served-remove-nozzle',
    phase: 'A3 · Attesa durante il rifornimento',
    label: 'Terminata l’erogazione, il gestore mantiene la presa sulla pistola',
    position: SERVED_STOP,
    gazeTarget: [4.6, 1.35, 4.15],
    duration: 2.5,
    cameraMode: 'vehicle',
    motion: 'hold',
    vehicleYaw: WESTBOUND,
    actor: attendant([6.45, 0, 4.35], [5.95, 0.72, 4.75], 'remove-nozzle'),
    nozzle: { owner: 'attendant', pump: 'servito', state: 'hand' },
  },
  {
    id: 'served-carry-back',
    phase: 'A3 · Attesa durante il rifornimento',
    label: 'Riporta la pistola direttamente alla pompa',
    position: SERVED_STOP,
    gazeTarget: [4.6, 1.35, 4.15],
    duration: 3,
    cameraMode: 'vehicle',
    motion: 'hold',
    vehicleYaw: WESTBOUND,
    actor: attendant([7.05, 0, 3.05], [3.57, 1.33, 2.09], 'carry-nozzle'),
    nozzle: { owner: 'attendant', pump: 'servito', state: 'hand' },
  },
  {
    id: 'served-replace-nozzle',
    phase: 'A3 · Attesa durante il rifornimento',
    label: 'Riaggancia la pistola prima di compiere qualsiasi altra azione',
    position: SERVED_STOP,
    gazeTarget: [4.6, 1.35, 4.15],
    duration: 2.5,
    cameraMode: 'vehicle',
    motion: 'hold',
    vehicleYaw: WESTBOUND,
    actor: attendant([3.6, 0, 3.15], [3.57, 1.33, 2.09], 'replace-nozzle'),
    nozzle: { owner: 'attendant', pump: 'servito', state: 'returning' },
  },
  {
    id: 'served-payment-choice',
    phase: 'A4 · Scelta del pagamento',
    label: 'Conclusa l’erogazione, sceglie se pagare al gestore o in Svolta',
    position: SERVED_STOP,
    gazeTarget: [4.6, 1.3, 4.15],
    duration: 0.6,
    cameraMode: 'vehicle',
    motion: 'hold',
    vehicleYaw: WESTBOUND,
    decision: 'operator-payment',
    actor: attendant([3.6, 0, 3.15], SERVED_STOP, 'return'),
    checkpoint: 'Scelta del pagamento',
  },
  {
    id: 'served-return-window',
    phase: 'A4 · Pagamento al gestore',
    label: 'Solo dopo il riaggancio torna al finestrino',
    position: SERVED_STOP,
    gazeTarget: [4.6, 1.3, 4.15],
    duration: 5,
    cameraMode: 'vehicle',
    motion: 'glance',
    vehicleYaw: WESTBOUND,
    actor: attendant([4.6, 0, 4.15], SERVED_STOP, 'return'),
    nozzle: { owner: 'attendant', pump: 'servito', state: 'holstered' },
  },
  {
    id: 'served-payment',
    phase: 'A4 · Pagamento al gestore',
    label: 'Il pagamento resta l’unico compito dominante',
    position: SERVED_STOP,
    gazeTarget: [4.6, 1.25, 4.15],
    duration: 7,
    cameraMode: 'vehicle',
    motion: 'hold',
    vehicleYaw: WESTBOUND,
    actor: attendant([4.6, 0, 4.15], SERVED_STOP, 'payment'),
  },
  ...departureSteps('served'),
]

const selfServiceSteps: JourneyStep[] = [
  ...commonArrivalSteps('self', SELF_STOP),
  selfFirstContactStep(),
  {
    id: 'self-exit',
    phase: 'B2 · Uscita dall’auto e orientamento verso l’accettatore',
    label: 'Esce dal lato conducente e individua il DSP in stato idle',
    position: [-4.6, 1.69, 7],
    gazeTarget: [-7.3, 1.4, 7],
    duration: 1.4,
    cameraMode: 'pedestrian',
    motion: 'exit',
    terminalScreen: 'idle',
    cameraTransition: 'character-cut',
  },
  {
    id: 'self-around-car',
    phase: 'B2 · Uscita dall’auto e orientamento verso l’accettatore',
    label: 'Aggira l’auto senza attraversarne l’ingombro',
    position: [-7.3, 1.69, 7],
    gazeTarget: [-9, 1.45, 0.3],
    duration: 3,
    cameraMode: 'pedestrian',
    motion: 'walk',
    terminalScreen: 'idle',
  },
  {
    id: 'self-walk-terminal',
    phase: 'B2 · Uscita dall’auto e orientamento verso l’accettatore',
    label: 'Lo schermo idle funziona da landmark durante il cammino',
    position: [-7.3, 1.69, 3.2],
    gazeTarget: [-9, 1.45, 0.3],
    duration: 3.5,
    cameraMode: 'pedestrian',
    motion: 'walk',
    mediaPointId: 'mp-05',
    terminalScreen: 'idle',
  },
  {
    id: 'self-terminal',
    phase: 'B3 · Identificazione erogatore e pagamento',
    label: 'Si ferma davanti al display',
    position: [-9, 1.69, 1.4],
    gazeTarget: [-9, 1.38, 0.3],
    duration: 2,
    cameraMode: 'pedestrian',
    motion: 'hold',
    mediaPointId: 'mp-05',
    terminalScreen: 'idle',
  },
  ...terminalFlowSteps(),
  {
    id: 'self-leave-terminal',
    phase: 'B4 · Chiusura transazione',
    label: 'Lascia il terminale solo dopo la conferma',
    position: [-7.3, 1.69, 3.2],
    gazeTarget: [-5.65, 1.33, 2.09],
    duration: 3,
    cameraMode: 'pedestrian',
    motion: 'walk',
    terminalScreen: 'confirmed',
  },
  {
    id: 'self-return-pump',
    phase: 'B5 · Ritorno dall’accettatore all’erogatore',
    label: 'Ritorna alla pompa con un carico cognitivo più basso',
    position: [-7.3, 1.69, 3.2],
    gazeTarget: [-5.65, 1.33, 2.09],
    duration: 2,
    cameraMode: 'pedestrian',
    motion: 'hold',
    mediaPointId: 'mp-01',
  },
  ...selfFuelSteps('self'),
  ...departureSteps('self'),
]

const servedPaymentChoiceIndex = servedSteps.findIndex(
  (step) => step.id === 'served-payment-choice',
)

const servedSvoltaSteps: JourneyStep[] = [
  ...servedSteps.slice(0, servedPaymentChoiceIndex + 1),
  {
    id: 'svolta-exit',
    phase: 'C1 · Uscita dall’auto dopo il rifornimento',
    label: 'Dopo la scelta esce dal lato conducente e individua Svolta',
    position: [4.6, 1.69, 7],
    gazeTarget: [6.8, 1.55, 5.2],
    duration: 1.4,
    cameraMode: 'pedestrian',
    motion: 'exit',
    cameraTransition: 'character-cut',
  },
  {
    id: 'svolta-clear-car',
    phase: 'C1 · Orientamento verso Svolta',
    label: 'Lascia l’ingombro dell’auto e prende subito la diagonale',
    position: [6.8, 1.69, 5.2],
    gazeTarget: [7.55, 1.55, 2.45],
    duration: 2.2,
    cameraMode: 'pedestrian',
    motion: 'walk',
  },
  {
    id: 'svolta-center-aisle',
    phase: 'C1 · Orientamento verso Svolta',
    label:
      'Attraversa il piazzale guardando naturalmente nella direzione di marcia',
    position: [7.55, 1.69, 2.45],
    gazeTarget: [8.5, 1.55, -0.6],
    duration: 2.6,
    cameraMode: 'pedestrian',
    motion: 'walk',
  },
  {
    id: 'svolta-behind-pumps',
    phase: 'C1 · Orientamento verso Svolta',
    label: 'Prosegue in diagonale verso le porte automatiche',
    position: [8.5, 1.69, -0.6],
    gazeTarget: [9.35, 1.65, -3.7],
    duration: 2.8,
    cameraMode: 'pedestrian',
    motion: 'walk',
  },
  {
    id: 'svolta-frontage',
    phase: 'C2 · Avvicinamento e ingresso in Svolta',
    label: 'Allinea il passo con l’apertura dell’ingresso',
    position: [9.2, 1.69, -2.85],
    gazeTarget: [9.5, 1.7, -4.4],
    duration: 2.2,
    cameraMode: 'pedestrian',
    motion: 'walk',
  },
  {
    id: 'svolta-entrance',
    phase: 'C2 · Avvicinamento e ingresso in Svolta',
    label: 'Raggiunge le porte dello store',
    position: [9.5, 1.69, -3.7],
    gazeTarget: [9.5, 1.8, -5.8],
    duration: 3,
    cameraMode: 'pedestrian',
    motion: 'walk',
  },
  {
    id: 'svolta-enter-store',
    phase: 'C2 · Avvicinamento e ingresso in Svolta',
    label: 'Entra nell’ambiente retail Svolta',
    position: [9.5, 1.69, -5.6],
    gazeTarget: [10.3, 1.35, -7.7],
    duration: 1.4,
    cameraMode: 'pedestrian',
    motion: 'walk',
    checkpoint: 'Ingresso in Svolta',
    cameraTransition: 'fade-cut',
  },
  {
    id: 'svolta-counter',
    phase: 'C3 · Pagamento in Svolta',
    label: 'Raggiunge la commessa alla cassa',
    position: [10.3, 1.69, -7.7],
    gazeTarget: [11.45, 1.2, -8.2],
    duration: 3,
    cameraMode: 'pedestrian',
    motion: 'walk',
  },
  {
    id: 'svolta-payment',
    phase: 'C3 · Pagamento in Svolta',
    label: 'Conclude il pagamento con la commessa',
    position: [10.3, 1.69, -7.7],
    gazeTarget: [11.45, 1.2, -8.2],
    duration: 8,
    cameraMode: 'pedestrian',
    motion: 'hold',
    dwellSeconds: 8,
    checkpoint: 'Pagamento alla cassa',
  },
  {
    id: 'svolta-exit-store',
    phase: 'C4 · Uscita da Svolta e ritorno all’auto',
    label: 'Esce dallo store e riprende la diagonale verso l’auto',
    position: [9.5, 1.69, -3.7],
    gazeTarget: [8.45, 1.5, -0.45],
    duration: 1.4,
    cameraMode: 'pedestrian',
    motion: 'walk',
    cameraTransition: 'fade-cut',
  },
  {
    id: 'svolta-return-behind-pumps',
    phase: 'C4 · Uscita da Svolta e ritorno all’auto',
    label: 'Attraversa nuovamente il piazzale guardando il percorso',
    position: [8.45, 1.69, -0.45],
    gazeTarget: [7.2, 1.5, 3.2],
    duration: 3.2,
    cameraMode: 'pedestrian',
    motion: 'walk',
  },
  {
    id: 'svolta-return-center',
    phase: 'C4 · Uscita da Svolta e ritorno all’auto',
    label: 'Completa la diagonale verso il lato conducente',
    position: [7.2, 1.69, 3.2],
    gazeTarget: [4.6, 1.45, 7],
    duration: 3,
    cameraMode: 'pedestrian',
    motion: 'walk',
  },
  {
    id: 'svolta-return-car',
    phase: 'C4 · Uscita da Svolta e ritorno all’auto',
    label: 'Raggiunge il lato conducente',
    position: [4.6, 1.69, 7],
    gazeTarget: [4.6, 1.3, 5.6],
    duration: 4,
    cameraMode: 'pedestrian',
    motion: 'walk',
  },
  {
    id: 'svolta-enter-car',
    phase: 'C4 · Rientro in auto',
    label: 'Rientra in auto dopo aver pagato',
    position: SERVED_STOP,
    gazeTarget: [-12, 1.3, 5.6],
    duration: 1.4,
    cameraMode: 'vehicle',
    motion: 'enter',
    vehicleYaw: WESTBOUND,
    cameraTransition: 'character-cut',
  },
  ...departureSteps('svolta'),
]

export const STATION_JOURNEYS: StationJourney[] = [
  {
    id: 'servito',
    name: 'A · Solo Servito',
    description: 'Accosto → presa in carico → attesa → pagamento → ripartenza.',
    arrivalPath: servedArrival,
    arrivalEndStepId: 'servito-stop',
    departurePath: servedDeparture,
    departureStartStepId: 'served-departure-start',
    steps: servedSteps,
  },
  {
    id: 'self-service',
    name: 'B · Self con accettatore',
    description: 'Auto → erogatore → accettatore → erogatore → auto.',
    arrivalPath: selfArrival,
    arrivalEndStepId: 'self-stop',
    departurePath: selfDeparture,
    departureStartStepId: 'self-departure-start',
    parkedVehicle: { position: [-4.6, 0, 5.6], yaw: WESTBOUND },
    steps: selfServiceSteps,
  },
  {
    id: 'servito-svolta',
    name: 'C · Servito con pagamento in Svolta',
    description: 'Auto → servizio del gestore → Svolta → auto.',
    arrivalPath: servedArrival,
    arrivalEndStepId: 'servito-stop',
    departurePath: servedDeparture,
    departureStartStepId: 'svolta-departure-start',
    parkedVehicle: { position: [4.6, 0, 5.6], yaw: WESTBOUND },
    steps: servedSvoltaSteps,
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

export function journeyElapsedBeforeStep(
  journey: StationJourney,
  stepId: string,
): number {
  const index = journey.steps.findIndex((step) => step.id === stepId)
  return journey.steps
    .slice(0, Math.max(index, 0))
    .reduce((total, step) => total + step.duration, 0)
}

export function journeyElapsedAfterStep(
  journey: StationJourney,
  stepId: string,
): number {
  const step = journey.steps.find((item) => item.id === stepId)
  return journeyElapsedBeforeStep(journey, stepId) + (step?.duration ?? 0)
}
