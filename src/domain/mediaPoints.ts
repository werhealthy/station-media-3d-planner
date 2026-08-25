import { z } from 'zod'
import { STATION_LAYOUT } from './stationLayout'
import { SupportShapeSchema, getSupportType } from './supportCatalog'

const MediaPointSchema = z.object({
  id: z.string(),
  number: z.number().int().min(1),
  name: z.string(),
  supportTypeId: z.string(),
  supportShape: SupportShapeSchema,
  location: z.string(),
  type: z.enum(['digital', 'print']),
  assignable: z.boolean(),
  surface: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  heightFromGround: z.number().nonnegative(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
})
export type MediaPoint = z.infer<typeof MediaPointSchema>

const { frontZ, pumpX } = STATION_LAYOUT.islands

function supportPoint(
  supportTypeId: string,
  point: Omit<
    MediaPoint,
    | 'supportTypeId'
    | 'supportShape'
    | 'name'
    | 'type'
    | 'assignable'
    | 'width'
    | 'height'
  >,
): MediaPoint {
  const support = getSupportType(supportTypeId)
  if (!support) throw new Error(`Supporto Q8 sconosciuto: ${supportTypeId}`)
  return {
    ...point,
    supportTypeId,
    supportShape: support.shape,
    name: support.name,
    type: support.type === 'digital' ? 'digital' : 'print',
    assignable: support.assignable,
    width: support.dimensions.width,
    height: support.dimensions.height,
  }
}

export const MEDIA_POINTS: MediaPoint[] = z.array(MediaPointSchema).parse([
  supportPoint('1', {
    id: 'mp-01',
    number: 1,
    location: 'Isola anteriore',
    surface: 'Cappuccio erogatore',
    heightFromGround: 2.4,
    position: [pumpX, 2.36, frontZ + 0.48],
    rotation: [0, 0, 0],
  }),
  supportPoint('2', {
    id: 'mp-02',
    number: 2,
    location: 'Ingresso isola anteriore',
    surface: 'Supporto a terra',
    heightFromGround: 0,
    position: [-pumpX, 0.79, frontZ + 2.35],
    rotation: [0, 0, 0],
  }),
  supportPoint('4', {
    id: 'mp-03',
    number: 4,
    location: 'Colonna pensilina',
    surface: 'Piastra verticale',
    heightFromGround: 1.35,
    position: [STATION_LAYOUT.canopy.columnX, 1.74, -0.86],
    rotation: [0, 0, 0],
  }),
  supportPoint('10', {
    id: 'mp-04',
    number: 10,
    location: 'Erogatore Servito',
    surface: 'Estensione erogatore',
    heightFromGround: 1.1,
    position: [pumpX - 0.92, 1.45, frontZ + 0.49],
    rotation: [0, 0, 0],
  }),
  supportPoint('11', {
    id: 'mp-05',
    number: 3,
    location: 'Isola Self · terminale di pagamento',
    surface: 'Display verticale touch 21 pollici',
    heightFromGround:
      STATION_LAYOUT.terminal.screenCenterY -
      STATION_LAYOUT.terminal.screenHeight / 2,
    position: [
      STATION_LAYOUT.terminal.x,
      STATION_LAYOUT.terminal.screenCenterY,
      STATION_LAYOUT.terminal.z,
    ],
    rotation: [0, 0, 0],
  }),
  supportPoint('6', {
    id: 'mp-06',
    number: 6,
    location: 'Ingresso Svolta',
    surface: 'Sagomato autoportante',
    heightFromGround: 0,
    position: [14.7, 0.9, -4.02],
    rotation: [0, 0, 0],
  }),
  supportPoint('5', {
    id: 'mp-07',
    number: 5,
    location: 'Fondale dietro le pompe',
    surface: 'Struttura 4 x 3 m',
    heightFromGround: 0.35,
    position: [-8.6, 1.85, -4.28],
    rotation: [0, 0, 0],
  }),
  supportPoint('7', {
    id: 'mp-08',
    number: 7,
    location: 'Palo bandiera',
    surface: 'Pannello bifacciale sospeso',
    heightFromGround: 1.05,
    position: [STATION_LAYOUT.totem.x, 1.64, STATION_LAYOUT.totem.z + 0.52],
    rotation: [0, 0, 0],
  }),
  supportPoint('9', {
    id: 'mp-09',
    number: 9,
    location: 'Ingresso piazzale',
    surface: 'Vela mobile',
    heightFromGround: 0,
    position: [
      STATION_LAYOUT.entry.beachFlagX,
      1.18,
      STATION_LAYOUT.entry.beachFlagZ,
    ],
    rotation: [0, 0, 0],
  }),
  supportPoint('8', {
    id: 'mp-10',
    number: 8,
    location: 'Ingresso isola',
    surface: 'Base fissa in cemento',
    heightFromGround: 0,
    position: [
      STATION_LAYOUT.entry.concreteSignX,
      0.72,
      STATION_LAYOUT.entry.concreteSignZ,
    ],
    rotation: [0, 0, 0],
  }),
])
