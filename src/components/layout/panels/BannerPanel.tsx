import { useViewerStore } from '@/stores/viewerStore'
import { useProjectStore } from '@/stores/projectStore'
import { Button } from '@/components/common/Button'
import { Plus, Trash2 } from 'lucide-react'
import { createAdvertisingPoint } from '@/domain/schemas/banner'

export function BannerPanel() {
  const selectedObjectId = useViewerStore((s) => s.selectedObjectId)
  const setSelectedObjectId = useViewerStore((s) => s.setSelectedObjectId)
  const getAllAdvertisingPoints = useProjectStore((s) => s.getAllAdvertisingPoints)
  const getAdvertisingPoint = useProjectStore((s) => s.getAdvertisingPoint)
  const addAdvertisingPoint = useProjectStore((s) => s.addAdvertisingPoint)
  const updateAdvertisingPoint = useProjectStore((s) => s.updateAdvertisingPoint)
  const removeAdvertisingPoint = useProjectStore((s) => s.removeAdvertisingPoint)
  const getAllMediaAssets = useProjectStore((s) => s.getAllMediaAssets)

  const banners = getAllAdvertisingPoints()
  const selectedBanner = selectedObjectId ? getAdvertisingPoint(selectedObjectId) : null
  const mediaAssets = getAllMediaAssets()

  const handleCreateBanner = (type: 'digital' | 'print') => {
    const banner = createAdvertisingPoint(
      `${type === 'digital' ? 'Banner digitale' : 'Cartello'} ${banners.length + 1}`,
      type,
      [0, 2, 0],
      [4, 2]
    )
    addAdvertisingPoint(banner)
    setSelectedObjectId(banner.id)
  }

  const handleUpdateBanner = (updates: Record<string, unknown>) => {
    if (!selectedBanner) return
    updateAdvertisingPoint(selectedBanner.id, updates as Parameters<typeof updateAdvertisingPoint>[1])
  }

  const handleDeleteBanner = () => {
    if (!selectedBanner) return
    removeAdvertisingPoint(selectedBanner.id)
    setSelectedObjectId(null)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Sezione creazione */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600">Crea nuovo banner</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleCreateBanner('digital')}
            className="flex-1"
          >
            <Plus size={14} /> Digitale
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleCreateBanner('print')}
            className="flex-1"
          >
            <Plus size={14} /> Cartaceo
          </Button>
        </div>
      </div>

      {/* Lista banner */}
      <div className="flex-1 overflow-y-auto">
        {banners.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
            Nessun banner. Crea il primo per iniziare.
          </div>
        ) : (
          <div className="space-y-1">
            {banners.map((banner) => (
              <button
                key={banner.id}
                onClick={() => setSelectedObjectId(banner.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-xs transition-colors ${
                  selectedObjectId === banner.id
                    ? 'bg-blue-100 text-blue-900 font-semibold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">
                    {banner.type === 'digital' ? '🟢' : '🟠'} {banner.name}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {banner.dimensions.width.toFixed(1)}×{banner.dimensions.height.toFixed(1)}m
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dettagli banner selezionato */}
      {selectedBanner && (
        <div className="space-y-3 border-t border-slate-200 pt-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Nome</label>
            <input
              type="text"
              value={selectedBanner.name}
              onChange={(e) => handleUpdateBanner({ name: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-600">Larghezza (m)</label>
              <input
                type="number"
                step="0.1"
                value={selectedBanner.dimensions.width}
                onChange={(e) =>
                  handleUpdateBanner({
                    dimensions: { ...selectedBanner.dimensions, width: parseFloat(e.target.value) },
                  })
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Altezza (m)</label>
              <input
                type="number"
                step="0.1"
                value={selectedBanner.dimensions.height}
                onChange={(e) =>
                  handleUpdateBanner({
                    dimensions: { ...selectedBanner.dimensions, height: parseFloat(e.target.value) },
                  })
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Assegna asset</label>
            <select
              value={selectedBanner.assignedMediaId || ''}
              onChange={(e) =>
                handleUpdateBanner({
                  assignedMediaId: e.target.value || undefined,
                })
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
            >
              <option value="">Nessun asset assegnato</option>
              {mediaAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.type === 'image' ? '🖼' : '🎬'} {asset.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDeleteBanner}
            className="w-full border-red-300 text-red-700 hover:bg-red-50"
          >
            <Trash2 size={14} /> Elimina banner
          </Button>
        </div>
      )}
    </div>
  )
}
