import { z } from 'zod'

export const MediaAssetSchema = z.object({
  id: z.string().min(1, 'ID richiesto'),
  name: z.string().min(1, 'Nome richiesto'),
  type: z.enum(['image', 'video']),
  mimeType: z.string().min(1, 'MIME type richiesto'),
  size: z.number().positive('Dimensione deve essere positiva'),
  width: z.number().positive('Larghezza deve essere positiva'),
  height: z.number().positive('Altezza deve essere positiva'),
  aspectRatio: z.number().positive('Aspect ratio deve essere positivo'),
  blobId: z.string().min(1, 'Blob ID richiesto'),
  duration: z.number().nonnegative().optional(), // solo per video, in secondi
  createdAt: z.number(), // timestamp
  thumbnail: z.string().optional(), // data URL per anteprima
})

export type MediaAsset = z.infer<typeof MediaAssetSchema>

export function calculateAspectRatio(width: number, height: number): number {
  return width / height
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
