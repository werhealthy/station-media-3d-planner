import { z } from 'zod'

const finite = z.number().finite()
export const Vector3Schema = z.tuple([finite, finite, finite])

export const StationTransformSchema = z.object({
  scale: Vector3Schema.default([1, 1, 1]),
  position: Vector3Schema.default([0, 0, 0]),
  rotation: Vector3Schema.default([0, 0, 0]),
})

export const GroundSchema = z.object({
  y: finite.optional(),
  meshName: z.string().min(1).optional(),
  meshPath: z.string().min(1).optional(),
  normal: Vector3Schema.optional(),
})

export const CameraViewSchema = z.object({
  position: Vector3Schema,
  target: Vector3Schema,
  fov: finite.min(1).max(179),
  zoom: finite.positive().optional(),
})

export const HotspotSchema = CameraViewSchema.extend({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  associatedMediaPointId: z.string().optional(),
})

export const ConfigMediaPointSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  name: z.string().min(1),
  type: z.enum(['digital', 'print']),
  position: Vector3Schema,
  normal: Vector3Schema,
  rotation: Vector3Schema,
  width: finite.positive(),
  height: finite.positive(),
  attachedMeshName: z.string().optional(),
  attachedMeshPath: z.string().optional(),
  location: z.string().default('Stazione'),
  surface: z.string().default('Superficie configurata'),
})

export const WalkPointSchema = z.object({
  id: z.string().min(1),
  position: Vector3Schema,
  lookAt: Vector3Schema.optional(),
  lookAtMediaPointId: z.string().optional(),
  dwellTime: finite.nonnegative().optional(),
})

export const StationConfigSchema = z
  .object({
    version: z.literal(1),
    stationId: z.string().min(1),
    modelPath: z.string().min(1).optional(),
    modelType: z.enum(['procedural', 'fbx', 'glb']),
    transform: StationTransformSchema.default({
      scale: [1, 1, 1],
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    }),
    hiddenMeshes: z.array(z.string().min(1)).default([]),
    ground: GroundSchema.optional(),
    overviewCamera: CameraViewSchema.optional(),
    hotspots: z.array(HotspotSchema).default([]),
    mediaPoints: z.array(ConfigMediaPointSchema).default([]),
    walkPath: z.array(WalkPointSchema).default([]),
  })
  .superRefine((config, context) => {
    for (const [label, entries] of [
      ['hotspot', config.hotspots],
      ['media point', config.mediaPoints],
      ['walk point', config.walkPath],
    ] as const) {
      const ids = new Set<string>()
      entries.forEach((entry, index) => {
        if (ids.has(entry.id))
          context.addIssue({
            code: 'custom',
            message: `ID ${label} duplicato: ${entry.id}`,
            path: [label === 'hotspot' ? 'hotspots' : label === 'media point' ? 'mediaPoints' : 'walkPath', index, 'id'],
          })
        ids.add(entry.id)
      })
    }
  })

export type StationConfig = z.infer<typeof StationConfigSchema>
export type ConfigMediaPoint = z.infer<typeof ConfigMediaPointSchema>
export type CameraView = z.infer<typeof CameraViewSchema>

export function createEmptyStationConfig(
  stationId: string,
  modelType: StationConfig['modelType'],
  modelPath?: string,
): StationConfig {
  return StationConfigSchema.parse({
    version: 1,
    stationId,
    modelType,
    ...(modelPath ? { modelPath } : {}),
  })
}

export function parseStationConfig(value: unknown): StationConfig {
  return StationConfigSchema.parse(value)
}

export function serializeStationConfig(config: StationConfig): string {
  return `${JSON.stringify(StationConfigSchema.parse(config), null, 2)}\n`
}
