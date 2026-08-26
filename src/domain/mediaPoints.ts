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
    heightFromGround: 2.595,
    position: [pumpX, 2.82, frontZ + 0.49],
    rotation: [0, 0, 0],
  }),
  supportPoint('2', {
    id: 'mp-02',
    number: 2,
    location: 'Testata corta isola Self',
    surface: 'Telaio bifacciale a due gambe',
    heightFromGround: 0.3655,
    position: [-pumpX + 2.05, 0.96, frontZ],
    rotation: [0, 90, 0],
  }),
  supportPoint('4', {
    id: 'mp-03',
    number: 4,
    location: 'Colonna pensilina',
    surface: 'Piastra verticale',
    heightFromGround: 1.35,
    position: [STATION_LAYOUT.canopy.columnX, 1.647, -0.86],
    rotation: [0, 0, 0],
  }),
  supportPoint('10', {
    id: 'mp-04',
    number: 10,
    location: 'Erogatore Servito',
    surface: 'Estensione erogatore',
    heightFromGround: 1.1,
    position: [pumpX + 1.72, 1.46, frontZ + 0.7],
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
    location: 'Piazzale davanti a Svolta',
    surface: 'Sagomato autoportante',
    heightFromGround: 0.1275,
    position: [14.6, 0.82, -2.65],
    rotation: [0, -10, 0],
  }),
  supportPoint('5', {
    id: 'mp-07',
    number: 5,
    location: 'Fondale dietro le pompe',
    surface: 'Fondale 2880 x 1380 mm',
    heightFromGround: 1.8,
    position: [-3.1, 2.49, -4.28],
    rotation: [0, 0, 0],
  }),
  supportPoint('7', {
    id: 'mp-08',
    number: 7,
    location: 'Palo bandiera',
    surface: 'Pannello bifacciale sospeso',
    heightFromGround: 1.9,
    position: [STATION_LAYOUT.totem.x, 2.8875, STATION_LAYOUT.totem.z + 0.28],
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
      1.8,
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
