export interface WalkthroughStep {
  id: string
  label: string
  position: [number, number, number]
  gazeTarget: [number, number, number]
  duration: number
  mediaPointId?: string
  dwellSeconds?: number
}

export const WALKTHROUGH_ROUTE: WalkthroughStep[] = [
  {
    id: 'arrival',
    label: 'Ingresso dalla strada',
    position: [-26, 1.72, 17],
    gazeTarget: [-20, 1.9, 8],
    duration: 5,
    mediaPointId: 'mp-09',
    dwellSeconds: 1.2,
  },
  {
    id: 'approach',
    label: 'Avvicinamento alle pompe',
    position: [-15, 1.72, 12],
    gazeTarget: [-13, 1.8, 9],
    duration: 5,
    mediaPointId: 'mp-10',
    dwellSeconds: 1.5,
  },
  {
    id: 'pump',
    label: 'Sosta erogatore',
    position: [-5, 1.72, 8],
    gazeTarget: [5, 2.3, 3.1],
    duration: 5.5,
    mediaPointId: 'mp-01',
    dwellSeconds: 2.2,
  },
  {
    id: 'columns',
    label: 'Comunicazione pensilina',
    position: [0, 1.72, 8],
    gazeTarget: [7, 2.2, 0.4],
    duration: 4.5,
    mediaPointId: 'mp-03',
    dwellSeconds: 1.8,
  },
  {
    id: 'shop',
    label: 'Facciata SVOLTA',
    position: [7, 1.72, 4],
    gazeTarget: [13, 3.3, -6],
    duration: 6,
    dwellSeconds: 2.4,
  },
  {
    id: 'entrance',
    label: 'Ingresso shop',
    position: [13, 1.72, 0],
    gazeTarget: [16, 2.1, -6],
    duration: 4.5,
    mediaPointId: 'mp-06',
    dwellSeconds: 1.8,
  },
  {
    id: 'totem',
    label: 'Totem e piazzale',
    position: [2, 1.72, 10],
    gazeTarget: [-11, 2.7, -6.25],
    duration: 6.5,
    mediaPointId: 'mp-07',
    dwellSeconds: 1.7,
  },
  {
    id: 'exit',
    label: 'Uscita',
    position: [25, 1.72, 17],
    gazeTarget: [5, 2.5, 0],
    duration: 5,
  },
]

export const WALKTHROUGH_DURATION = WALKTHROUGH_ROUTE.reduce(
  (total, step) => total + step.duration,
  0,
)
