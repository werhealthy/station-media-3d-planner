import { z } from 'zod'
export const MediaAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.enum(['image/jpeg', 'image/png']),
  size: z.number(),
  width: z.number(),
  height: z.number(),
  aspectRatio: z.number().positive(),
  url: z.string(),
})
export type MediaAsset = z.infer<typeof MediaAssetSchema>
export async function readImageAsset(file: File): Promise<MediaAsset> {
  if (!['image/jpeg', 'image/png'].includes(file.type))
    throw new Error('Carica un file JPEG o PNG.')
  if (file.size > 15 * 1024 * 1024)
    throw new Error('Il file supera il limite di 15 MB.')
  const url = URL.createObjectURL(file)
  let dimensions: { width: number; height: number }
  try {
    dimensions = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const image = new Image()
        image.onload = () =>
          resolve({ width: image.naturalWidth, height: image.naturalHeight })
        image.onerror = () => reject(new Error('Immagine non valida.'))
        image.src = url
      },
    )
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
  return {
    id: crypto.randomUUID(),
    name: file.name,
    mimeType: file.type as 'image/jpeg' | 'image/png',
    size: file.size,
    url,
    aspectRatio: dimensions.width / dimensions.height,
    ...dimensions,
  }
}
