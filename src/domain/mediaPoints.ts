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

const { frontZ, backZ } = STATION_LAYOUT.islands

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
    position: [4, 2.36, frontZ + 0.48],
    rotation: [0, 0, 0],
  }),
  supportPoint('2', {
    id: 'mp-02',
    number: 2,
    location: 'Ingresso isola anteriore',
    surface: 'Supporto a terra',
    heightFromGround: 0,
    position: [8.2, 0.62, frontZ + 2.2],
    rotation: [0, 0, 0],
  }),
  supportPoint('4', {
    id: 'mp-03',
    number: 3,
    location: 'Colonna pensilina',
    surface: 'Piastra verticale',
    heightFromGround: 1.35,
    position: [7, 2.1, 0.39],
    rotation: [0, 0, 0],
  }),
  supportPoint('10', {
    id: 'mp-04',
    number: 4,
    location: 'Erogatore posteriore',
    surface: 'Estensione erogatore',
    heightFromGround: 1.1,
    position: [-3.08, 1.45, backZ + 0.49],
    rotation: [0, 0, 0],
  }),
  supportPoint('11', {
    id: 'mp-05',
    number: 5,
    location: 'Accettatore Self',
    surface: 'Display digitale 21 pollici',
    heightFromGround: 1.35,
    position: [-11.5, 1.52, -0.86],
    rotation: [0, 0, 0],
  }),
  supportPoint('6', {
    id: 'mp-06',
    number: 6,
    location: 'Ingresso Svolta',
    surface: 'Sagomato autoportante',
    heightFromGround: 0,
    position: [18.5, 1.05, -5.72],
    rotation: [0, 0, 0],
  }),
  supportPoint('5', {
    id: 'mp-07',
    number: 7,
    location: 'Perimetro piazzale',
    surface: 'Struttura 4 x 3 m',
    heightFromGround: 0.35,
    position: [18, 1.85, 12.5],
    rotation: [0, 180, 0],
  }),
  supportPoint('7', {
    id: 'mp-08',
    number: 8,
    location: 'Palo bandiera',
    surface: 'Pannello bifacciale sospeso',
    heightFromGround: 1.05,
    position: [-22, 1.85, -9.43],
    rotation: [0, 0, 0],
  }),
  supportPoint('9', {
    id: 'mp-09',
    number: 9,
    location: 'Ingresso piazzale',
    surface: 'Vela mobile',
    heightFromGround: 0,
    position: [-20, 1.5, 8],
    rotation: [0, 0, 0],
  }),
  supportPoint('8', {
    id: 'mp-10',
    number: 10,
    location: 'Ingresso isola',
    surface: 'Base fissa in cemento',
    heightFromGround: 0,
    position: [-13, 1.05, 9],
    rotation: [0, 0, 0],
  }),
])
