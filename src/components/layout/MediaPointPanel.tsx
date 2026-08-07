import { ArrowLeft, Check, ImagePlus, Trash2 } from 'lucide-react'
import { MEDIA_POINTS } from '@/domain/mediaPoints'
import { readImageAsset } from '@/domain/schemas/media'
import { useProjectStore } from '@/stores/projectStore'
import { useViewerStore } from '@/stores/viewerStore'
import { useState } from 'react'

export function MediaPointPanel({
  configured = true,
}: {
  configured?: boolean
}) {
  const selectedId = useViewerStore((s) => s.selectedMediaPointId),
    select = useViewerStore((s) => s.selectMediaPoint)
  const assignments = useProjectStore((s) => s.assignments),
    assign = useProjectStore((s) => s.assignAsset),
    clear = useProjectStore((s) => s.clearAsset)
  const [error, setError] = useState('')
  if (!configured) {
    return (
      <aside className="flex w-[370px] shrink-0 flex-col border-l border-slate-200 bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1d55bf]">
          Media inventory
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          Media point non configurati
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Questa stazione non è ancora configurata con media point.
        </p>
      </aside>
    )
  }
  const point = MEDIA_POINTS.find((p) => p.id === selectedId)
  const asset = point ? assignments[point.id] : undefined
  async function upload(file?: File) {
    if (!file || !point) return
    setError('')
    try {
      assign(point.id, await readImageAsset(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload non riuscito.')
    }
  }
  return (
    <aside className="flex w-[370px] shrink-0 flex-col border-l border-slate-200 bg-white">
      {!point ? (
        <>
          <div className="border-b border-slate-100 p-6">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1d55bf]">
              Media inventory
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              10 media point
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Seleziona uno spazio per assegnare la creatività.
            </p>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {MEDIA_POINTS.map((p) => (
              <button
                key={p.id}
                onClick={() => select(p.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${p.type === 'digital' ? 'bg-[#1954c6]' : 'bg-[#e4a11b]'}`}
                >
                  {p.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-800">
                    {p.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {p.location} · {p.type === 'digital' ? 'Digital' : 'Print'}
                  </span>
                </span>
                {assignments[p.id] && (
                  <Check size={18} className="text-emerald-600" />
                )}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="border-b border-slate-100 p-5">
            <button
              onClick={() => select(null)}
              className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={17} />
              Tutti i media point
            </button>
            <div className="flex items-center gap-3">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white ${point.type === 'digital' ? 'bg-[#1954c6]' : 'bg-[#e4a11b]'}`}
              >
                {point.number}
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {point.name}
                </h2>
                <p className="text-sm text-slate-500">{point.location}</p>
              </div>
            </div>
          </div>
          <div className="space-y-6 overflow-y-auto p-5">
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Proprietà
              </h3>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-slate-500">Tipo</dt>
                <dd className="text-right font-semibold">
                  {point.type === 'digital' ? 'Digital' : 'Print'}
                </dd>
                <dt className="text-slate-500">Supporto</dt>
                <dd className="text-right font-semibold">{point.surface}</dd>
                <dt className="text-slate-500">Dimensioni</dt>
                <dd className="text-right font-semibold">
                  {point.width} × {point.height} m
                </dd>
              </dl>
            </section>
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Creatività assegnata
              </h3>
              {asset ? (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <img
                    src={asset.url}
                    alt="Anteprima creatività"
                    className="aspect-video w-full bg-slate-100 object-contain"
                  />
                  <div className="flex items-center justify-between p-3">
                    <span className="max-w-[230px] truncate text-sm font-medium">
                      {asset.name}
                    </span>
                    <button
                      aria-label="Rimuovi creatività"
                      onClick={() => clear(point.id)}
                      className="text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    id="creative-upload"
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    onChange={(e) => void upload(e.target.files?.[0])}
                  />
                  <label
                    htmlFor="creative-upload"
                    className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-4 py-8 text-center hover:bg-blue-50"
                  >
                    <ImagePlus className="mb-3 text-[#1954c6]" />
                    <span className="font-semibold text-slate-800">
                      Carica JPEG o PNG
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      Massimo 15 MB
                    </span>
                  </label>
                </>
              )}
              {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  {error}
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </aside>
  )
}
