import { z } from 'zod'

const MAX_FILE_SIZE = 15 * 1024 * 1024
const PDF_MIME_TYPE = 'application/pdf'

export type MediaMimeType = 'image/jpeg' | 'image/png' | 'application/pdf'

export const MediaAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.enum(['image/jpeg', 'image/png', PDF_MIME_TYPE]),
  size: z.number(),
  width: z.number(),
  height: z.number(),
  aspectRatio: z.number().positive(),
  url: z.string(),
})
export type MediaAsset = z.infer<typeof MediaAssetSchema>

function isPdf(file: File) {
  return file.type === PDF_MIME_TYPE || file.name.toLowerCase().endsWith('.pdf')
}

async function getImageDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('Immagine non valida.'))
    image.src = url
  })
}

async function rasterizeFirstPdfPage(file: File) {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default

  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() })
  try {
    const document = await loadingTask.promise
    const page = await document.getPage(1)
    const sourceViewport = page.getViewport({ scale: 1 })
    const longestSide = Math.max(sourceViewport.width, sourceViewport.height)
    const scale = Math.min(2, 2560 / Math.max(longestSide, 1))
    const viewport = page.getViewport({ scale })
    const canvas = window.document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Impossibile creare l’anteprima del PDF.')
    await page.render({ canvas, canvasContext: context, viewport }).promise
    const preview = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error('Impossibile creare l’anteprima del PDF.')),
        'image/png',
      ),
    )
    return {
      width: canvas.width,
      height: canvas.height,
      url: URL.createObjectURL(preview),
    }
  } finally {
    await loadingTask.destroy()
  }
}

export async function readCreativeAsset(file: File): Promise<MediaAsset> {
  if (file.size > MAX_FILE_SIZE)
    throw new Error('Il file supera il limite di 15 MB.')

  if (isPdf(file)) {
    try {
      const preview = await rasterizeFirstPdfPage(file)
      return {
        id: crypto.randomUUID(),
        name: file.name,
        mimeType: PDF_MIME_TYPE,
        size: file.size,
        aspectRatio: preview.width / preview.height,
        ...preview,
      }
    } catch (error) {
      throw new Error(
        error instanceof Error && error.message.includes('anteprima')
          ? error.message
          : 'PDF non valido o impossibile da leggere.',
        { cause: error },
      )
    }
  }

  if (!['image/jpeg', 'image/png'].includes(file.type))
    throw new Error('Carica un file JPEG, PNG o PDF.')

  const url = URL.createObjectURL(file)
  let dimensions: { width: number; height: number }
  try {
    dimensions = await getImageDimensions(url)
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
  return {
    id: crypto.randomUUID(),
    name: file.name,
    mimeType: file.type as Extract<MediaMimeType, `image/${string}`>,
    size: file.size,
    url,
    aspectRatio: dimensions.width / dimensions.height,
    ...dimensions,
  }
}

/** @deprecated Usa readCreativeAsset: supporta anche PDF. */
export const readImageAsset = readCreativeAsset
