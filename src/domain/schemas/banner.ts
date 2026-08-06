import { z } from 'zod'

export const AdvertisingPointSchema = z.object({
  id: z.string().min(1, 'ID richiesto'),
  name: z.string().min(1, 'Nome richiesto'),
  type: z.enum(['digital', 'print']),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  rotation: z.object({
    x: z.number(), // gradi
    y: z.number(), // gradi
    z: z.number(), // gradi
  }),
  dimensions: z.object({
    width: z.number().positive('Larghezza deve essere positiva'),
    height: z.number().positive('Altezza deve essere positiva'),
  }),
  assignedMediaId: z.string().optional(), // ID dell'asset assegnato
  fitMode: z.enum(['contain', 'cover']).default('contain'), // come fit l'immagine
  visible: z.boolean().default(true),
  maxViewDistance: z.number().positive().default(50), // distanza massima di analisi (metri)
  maxViewAngle: z.number().positive().default(90), // angolo massimo consigliato (gradi)
  notes: z.string().optional(),
})

export type AdvertisingPoint = z.infer<typeof AdvertisingPointSchema>

export function createAdvertisingPoint(
  name: string,
  type: 'digital' | 'print',
  position: [number, number, number],
  dimensions: [number, number]
): AdvertisingPoint {
  return {
    id: `banner-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    type,
    position: { x: position[0], y: position[1], z: position[2] },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { width: dimensions[0], height: dimensions[1] },
    fitMode: 'contain',
    visible: true,
    maxViewDistance: 50,
    maxViewAngle: 90,
  }
}
