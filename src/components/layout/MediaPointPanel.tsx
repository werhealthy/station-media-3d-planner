import {
  ArrowLeft,
  Check,
  Crosshair,
  Eye,
  EyeOff,
  Images,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { ConfigMediaPoint } from '@/domain/stationConfig'
import { readCreativeAsset } from '@/domain/schemas/media'
import { getSupportType } from '@/domain/supportCatalog'
import {
  analyzeCreativeFit,
  orientCreativeToPortrait,
} from '@/core/creative/creativeFit'
import { useProjectStore } from '@/stores/projectStore'
import { useViewerStore } from '@/stores/viewerStore'
import {
  SUPPORT_REFERENCES,
  type SupportReferencePhoto,
} from '@/domain/supportReferences'
import {
  CreativeWorkspace,
  PUMP_LEADER_OPTIMIZED_ASSET_ID,
} from './CreativeWorkspace'

const millimetres = (metres: number) => Math.round(metres * 1000)
export function MediaPointPanel({ points }: { points: ConfigMediaPoint[] }) {
  const selectedId = useViewerStore((state) => state.selectedMediaPointId)
  const focusedId = useViewerStore((state) => state.focusedMediaPointId)
  const select = useViewerStore((state) => state.selectMediaPoint)
  const focus = useViewerStore((state) => state.focusMediaPoint)
  const assignments = useProjectStore((state) => state.assignments)
  const assign = useProjectStore((state) => state.assignAsset)
  const updateCreativeDisplay = useProjectStore(
    (state) => state.updateCreativeDisplay,
  )
  const hiddenMediaPointIds = useProjectStore(
    (state) => state.hiddenMediaPointIds,
  )
  const toggleVisibility = useProjectStore(
    (state) => state.toggleMediaPointVisibility,
  )
  const showAll = useProjectStore((state) => state.showAllMediaPoints)
  const [error, setError] = useState('')
  const [referenceIndex, setReferenceIndex] = useState<number | null>(null)
  const [creativeWorkspaceOpen, setCreativeWorkspaceOpen] = useState(false)
  const [draftAsset, setDraftAsset] =
    useState<Awaited<ReturnType<typeof readCreativeAsset>>>()
  const [analyzedAssetIds, setAnalyzedAssetIds] = useState<
    Record<string, string>
  >({})
  const inventoryPoints = points
    .filter((item) => item.assignable)
    .sort((left, right) => left.number - right.number)
  const point = inventoryPoints.find((item) => item.id === selectedId)
  const asset = point ? assignments[point.id] : undefined
  const sidebarOrientedAsset =
    point && asset && point.supportShape === 'beach-flag'
      ? orientCreativeToPortrait(asset.width, asset.height)
      : asset
  const assetNeedsAdaptation = Boolean(
    point &&
    sidebarOrientedAsset &&
    analyzeCreativeFit({
      assetWidth: sidebarOrientedAsset.width,
      assetHeight: sidebarOrientedAsset.height,
      surfaceWidth: point.width,
      surfaceHeight: point.height,
    }).status === 'mismatch',
  )
  const pointHidden = point ? hiddenMediaPointIds.includes(point.id) : false
  const support = getSupportType(point?.supportTypeId)
  const referencePhotos: SupportReferencePhoto[] = point?.supportTypeId
    ? (SUPPORT_REFERENCES[point.supportTypeId] ?? [])
    : []
  const pointId = point?.id
  async function upload(file?: File) {
    if (!file || !point) return
    setError('')
    try {
      const nextAsset = await readCreativeAsset(file)
      setDraftAsset((current) => {
        if (current?.url.startsWith('blob:')) URL.revokeObjectURL(current.url)
        return nextAsset
      })
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Upload non riuscito.',
      )
    }
  }

  function closeCreativeWorkspace() {
    if (draftAsset?.url.startsWith('blob:')) URL.revokeObjectURL(draftAsset.url)
    setDraftAsset(undefined)
    setCreativeWorkspaceOpen(false)
  }

  function markAssetAnalyzed(assetId: string) {
    if (!pointId) return
    setAnalyzedAssetIds((current) => ({
      ...current,
      [pointId]: assetId,
    }))
  }

  if (!points.length) {
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

  return (
    <aside className="flex w-[370px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-[-12px_0_35px_rgba(15,31,70,0.06)]">
      {!point ? (
        <>
          <div className="border-b border-slate-100 p-6">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1d55bf]">
              Media inventory
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {inventoryPoints.length} supporti caricabili
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Catalogo Q8 allineato alla distinta dei touchpoint.
            </p>
            {hiddenMediaPointIds.length > 0 && (
              <button
                type="button"
                onClick={showAll}
                className="mt-3 flex items-center gap-2 text-xs font-bold text-[#1954c6] hover:underline"
              >
                <Eye size={15} /> Mostra tutti ({hiddenMediaPointIds.length}{' '}
                nascosti)
              </button>
            )}
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {inventoryPoints.map((item) => {
              const isHidden = hiddenMediaPointIds.includes(item.id)
              return (
                <div
                  key={item.id}
                  className={`flex items-center rounded-xl border transition ${isHidden ? 'border-slate-200 bg-slate-50 opacity-65' : focusedId === item.id ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'}`}
                >
                  <button
                    type="button"
                    onClick={() => select(item.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${item.type === 'digital' ? 'bg-[#1954c6]' : item.assignable ? 'bg-[#e4a11b]' : 'bg-slate-500'}`}
                    >
                      {item.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-slate-800">
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        ID {item.supportTypeId ?? 'custom'} · {item.location}
                      </span>
                    </span>
                    {assignments[item.id] && (
                      <Check size={18} className="text-emerald-600" />
                    )}
                  </button>
                  <button
                    type="button"
                    title={`Inquadra ${item.name} nella scena`}
                    aria-label={`Inquadra ${item.name}`}
                    onClick={() => focus(item.id)}
                    className={`rounded-lg p-2 transition ${focusedId === item.id ? 'bg-[#1954c6] text-white' : 'text-[#1954c6] hover:bg-blue-100'}`}
                  >
                    <Crosshair size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label={`${isHidden ? 'Mostra' : 'Nascondi'} ${item.name}`}
                    onClick={() => toggleVisibility(item.id)}
                    className="mr-2 rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700"
                  >
                    {isHidden ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              )
            })}
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
              Tutti i supporti
            </button>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
              Supporto selezionato
            </p>
            <div className="flex items-center gap-3">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white ${point.type === 'digital' ? 'bg-[#1954c6]' : point.assignable ? 'bg-[#e4a11b]' : 'bg-slate-500'}`}
              >
                {point.number}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold text-slate-900">
                  {point.name}
                </h2>
                <p className="text-sm text-slate-500">{point.location}</p>
                {pointHidden && (
                  <p className="mt-1 text-xs font-bold text-amber-700">
                    Supporto nascosto nella scena
                  </p>
                )}
              </div>
              <button
                type="button"
                title={
                  pointHidden
                    ? 'Mostra il supporto nella scena'
                    : 'Nascondi il supporto dalla scena'
                }
                aria-label={`${pointHidden ? 'Mostra' : 'Nascondi'} ${point.name}`}
                onClick={() => toggleVisibility(point.id)}
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition ${pointHidden ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-[#1954c6]'}`}
              >
                {pointHidden ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            {point.assignable && (
              <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-3.5 shadow-sm">
                <div className="flex items-center gap-3">
                  {asset ? (
                    <img
                      src={asset.url}
                      alt="Anteprima creatività assegnata"
                      className="h-16 w-14 shrink-0 rounded-lg border border-white bg-white object-contain shadow-sm"
                    />
                  ) : (
                    <span className="grid h-16 w-14 shrink-0 place-items-center rounded-lg bg-[#1954c6] text-white shadow-sm">
                      <ImagePlus size={23} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#1954c6]">
                      Creatività
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-slate-900">
                      {asset ? asset.name : 'Nessun asset caricato'}
                    </p>
                    <p
                      className={`mt-0.5 text-[11px] font-semibold leading-4 ${asset && analyzedAssetIds[point.id] === asset.id && ((point.supportTypeId === '2' && asset.id !== PUMP_LEADER_OPTIMIZED_ASSET_ID) || assetNeedsAdaptation) ? 'text-red-600' : 'text-slate-500'}`}
                    >
                      {asset
                        ? analyzedAssetIds[point.id] === asset.id
                          ? point.supportTypeId === '2' &&
                            asset.id !== PUMP_LEADER_OPTIMIZED_ASSET_ID
                            ? '4 criticità rilevate.'
                            : assetNeedsAdaptation
                              ? 'Formato da adattare.'
                              : asset.id === PUMP_LEADER_OPTIMIZED_ASSET_ID
                                ? 'Versione ottimizzata applicata.'
                                : 'Verifica AI completata.'
                          : 'Pronta per la verifica.'
                        : 'Carica la grafica in uno spazio dedicato.'}
                    </p>
                  </div>
                </div>
                <div
                  className={`mt-3 grid gap-2 ${asset ? 'grid-cols-2' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => setCreativeWorkspaceOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1954c6] px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#123f99]"
                  >
                    <ImagePlus size={17} />
                    {asset ? 'Apri creatività' : 'Carica creatività'}
                  </button>
                  {asset && (
                    <label
                      htmlFor={`creative-sidebar-replace-${point.id}`}
                      className="flex cursor-pointer items-center justify-center rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-bold text-[#1954c6] hover:bg-blue-50"
                    >
                      <input
                        id={`creative-sidebar-replace-${point.id}`}
                        type="file"
                        accept="image/jpeg,image/png,application/pdf,.pdf"
                        className="sr-only"
                        onChange={(event) => {
                          void upload(event.target.files?.[0])
                          setCreativeWorkspaceOpen(true)
                        }}
                      />
                      Sostituisci immagine
                    </label>
                  )}
                </div>
              </section>
            )}
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Dettagli del supporto
              </h3>
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2.5 text-sm">
                <dt className="text-slate-500">Tipologia</dt>
                <dd className="text-right font-semibold">
                  {point.assignable
                    ? point.type === 'digital'
                      ? 'Digital'
                      : 'Print'
                    : 'Strutturale'}
                </dd>
                <dt className="text-slate-500">Dimensioni</dt>
                <dd className="text-right font-semibold tabular-nums">
                  {millimetres(point.width)} × {millimetres(point.height)} mm
                </dd>
                <dt className="text-slate-500">Orientamento</dt>
                <dd className="text-right font-semibold">
                  {point.width >= point.height ? 'Orizzontale' : 'Verticale'}
                </dd>
                {support && (
                  <>
                    <dt className="border-t border-slate-100 pt-3 text-slate-500">
                      Distanza di lettura
                    </dt>
                    <dd className="border-t border-slate-100 pt-3 text-right font-semibold">
                      {support.targetDistance}
                    </dd>
                    <dt className="text-slate-500">Tempo disponibile</dt>
                    <dd className="text-right font-semibold">
                      {support.eyesOn}
                    </dd>
                    <dt className="text-slate-500">Testo consigliato</dt>
                    <dd className="text-right font-semibold">
                      {support.maxWords}
                    </dd>
                  </>
                )}
              </dl>
            </section>

            {referencePhotos.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Foto nel mondo reale
                  </h3>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <Images size={14} /> {referencePhotos.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReferenceIndex(0)}
                  className="group relative block w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left shadow-sm"
                >
                  <img
                    src={referencePhotos[0]!.src}
                    alt={referencePhotos[0]!.alt}
                    className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                  <span className="absolute bottom-2 right-2 rounded-full bg-slate-950/75 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                    Apri galleria
                  </span>
                </button>
                {referencePhotos.length > 1 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {referencePhotos.slice(0, 3).map((item, index) => (
                      <button
                        type="button"
                        key={item.src}
                        onClick={() => setReferenceIndex(index)}
                        className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={item.src}
                          alt={item.alt}
                          className="h-16 w-full object-cover transition hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-[11px] leading-4 text-slate-500">
                  Riferimenti fotografici estratti dalla distinta Q8 condivisa.
                </p>
              </section>
            )}

            {creativeWorkspaceOpen && (
              <CreativeWorkspace
                key={`${point.id}:${draftAsset?.id ?? asset?.id ?? 'empty'}`}
                point={point}
                asset={draftAsset ?? asset}
                assetIsDraft={Boolean(draftAsset)}
                analyzed={Boolean(
                  (draftAsset ?? asset) &&
                  analyzedAssetIds[point.id] === (draftAsset ?? asset)?.id,
                )}
                error={error}
                onUpload={(file) => void upload(file)}
                onAnalyzed={markAssetAnalyzed}
                onApply={(nextAsset, display) => {
                  if (
                    draftAsset?.url.startsWith('blob:') &&
                    draftAsset.url !== nextAsset.url
                  )
                    URL.revokeObjectURL(draftAsset.url)
                  assign(point.id, nextAsset)
                  updateCreativeDisplay(point.id, display)
                  setDraftAsset(undefined)
                  setCreativeWorkspaceOpen(false)
                }}
                onClose={closeCreativeWorkspace}
              />
            )}
          </div>
        </>
      )}
      {referenceIndex !== null && referencePhotos[referenceIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galleria ${point?.name ?? 'supporto'}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 p-6 backdrop-blur-sm"
          onClick={() => setReferenceIndex(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-[#202329] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between px-5 py-4 text-white">
              <div>
                <p className="font-bold">{point?.name}</p>
                <p className="text-xs text-white/60">
                  Foto {referenceIndex + 1} di {referencePhotos.length}
                </p>
              </div>
              <button
                type="button"
                aria-label="Chiudi galleria"
                onClick={() => setReferenceIndex(null)}
                className="rounded-full p-2 text-white/75 hover:bg-white/10 hover:text-white"
              >
                <X />
              </button>
            </header>
            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/30 p-4">
              <img
                src={referencePhotos[referenceIndex]!.src}
                alt={referencePhotos[referenceIndex]!.alt}
                className="max-h-[72vh] max-w-full object-contain"
              />
              {referencePhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Foto precedente"
                    onClick={() =>
                      setReferenceIndex(
                        (referenceIndex - 1 + referencePhotos.length) %
                          referencePhotos.length,
                      )
                    }
                    className="absolute left-4 rounded-full bg-black/55 p-3 text-white hover:bg-black/75"
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    type="button"
                    aria-label="Foto successiva"
                    onClick={() =>
                      setReferenceIndex(
                        (referenceIndex + 1) % referencePhotos.length,
                      )
                    }
                    className="absolute right-4 rounded-full bg-black/55 p-3 text-white hover:bg-black/75"
                  >
                    <ChevronRight />
                  </button>
                </>
              )}
            </div>
            <p className="px-5 py-4 text-sm text-white/75">
              {referencePhotos[referenceIndex]!.alt}
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
