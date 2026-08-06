import { useRef, useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { MediaAssetSchema, formatFileSize } from '@/domain/schemas/media'
import { X, Upload } from 'lucide-react'
import { Button } from '@/components/common/Button'

export function AssetPanel() {
  const mediaAssets = useProjectStore((s) => s.getAllMediaAssets())
  const addMediaAsset = useProjectStore((s) => s.addMediaAsset)
  const removeMediaAsset = useProjectStore((s) => s.removeMediaAsset)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const processFile = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      alert(`Formato non supportato: ${file.type}. Usa JPEG, PNG, WebP, MP4, o WebM.`)
      return
    }

    const maxSize = 50 * 1024 * 1024 // 50 MB
    if (file.size > maxSize) {
      alert(`File troppo grande: ${formatFileSize(file.size)}. Massimo: ${formatFileSize(maxSize)}`)
      return
    }

    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')

    if (isImage) {
      const img = new Image()
      img.onload = () => {
        const asset = MediaAssetSchema.parse({
          id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: 'image',
          mimeType: file.type,
          size: file.size,
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          blobId: URL.createObjectURL(file),
          createdAt: Date.now(),
        })
        addMediaAsset(asset)
      }
      img.onerror = () => alert('Errore nel caricamento dell\'immagine.')
      img.src = URL.createObjectURL(file)
    } else if (isVideo) {
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        const asset = MediaAssetSchema.parse({
          id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: 'video',
          mimeType: file.type,
          size: file.size,
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio: video.videoWidth / video.videoHeight,
          blobId: URL.createObjectURL(file),
          duration: video.duration,
          createdAt: Date.now(),
        })
        addMediaAsset(asset)
      }
      video.onerror = () => alert('Errore nel caricamento del video.')
      video.src = URL.createObjectURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file) processFile(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files) return
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file) processFile(file)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Zona drag-drop */}
      <div
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <Upload size={24} className="mx-auto mb-2 text-slate-600" />
        <p className="text-sm font-medium text-slate-700">Trascina immagini o video</p>
        <p className="text-xs text-slate-500">oppure clicca per selezionare</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Lista degli asset */}
      <div className="flex-1 overflow-y-auto">
        {mediaAssets.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
            Nessun asset caricato ancora.
          </div>
        ) : (
          <div className="space-y-2">
            {mediaAssets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-start gap-2 rounded-md border border-slate-200 bg-white p-2 text-xs hover:bg-slate-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-slate-900">{asset.name}</p>
                  <p className="text-slate-500">
                    {asset.type === 'image' ? '🖼' : '🎬'} {asset.width}×{asset.height} •{' '}
                    {formatFileSize(asset.size)}
                  </p>
                  {asset.duration && <p className="text-slate-500">Durata: {asset.duration.toFixed(1)}s</p>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMediaAsset(asset.id)}
                  title="Rimuovi asset"
                  className="shrink-0"
                >
                  <X size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
