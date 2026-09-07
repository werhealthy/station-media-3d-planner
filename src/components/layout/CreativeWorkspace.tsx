import {
  CheckCircle2,
  CircleAlert,
  ImagePlus,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import type { MediaAsset } from '@/domain/schemas/media'
import type { ConfigMediaPoint } from '@/domain/stationConfig'
import {
  analyzeCreativeFit,
  orientCreativeToPortrait,
} from '@/core/creative/creativeFit'
import { getSupportType } from '@/domain/supportCatalog'
import {
  DEFAULT_CREATIVE_DISPLAY,
  useProjectStore,
} from '@/stores/projectStore'

export const PUMP_LEADER_OPTIMIZED_URL =
  '/brand/q8/ai/pump-leader-optimized.jpg'
export const PUMP_LEADER_OPTIMIZED_ASSET_ID = 'mvp-ai-pump-leader-optimized'

type ActionStage = 'review' | 'generating' | 'ready'

interface CreativeWorkspaceProps {
  point: ConfigMediaPoint
  asset?: MediaAsset
  analyzed: boolean
  error: string
  onUpload: (file?: File) => void
  onAnalyzed: (assetId: string) => void
  onApply: (asset: MediaAsset) => void
  onClose: () => void
}

const pumpIssues = [
  'Headline troppo piccola per una lettura di 1–2 secondi',
  'Prodotto poco protagonista rispetto allo spazio disponibile',
  'La data domina il messaggio principale nel footer',
]

function ReviewMarker({
  number,
  className,
}: {
  number: number
  className: string
}) {
  return (
    <span
      className={`absolute grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-red-600 text-[11px] font-black text-white shadow-lg ${className}`}
      aria-label={`Criticità ${number}`}
    >
      {number}
    </span>
  )
}

function BeforeAfterSlider({ originalUrl }: { originalUrl: string }) {
  const [reveal, setReveal] = useState(50)
  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <img
        src={originalUrl}
        alt="Creatività originale"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }}
      >
        <img
          src={PUMP_LEADER_OPTIMIZED_URL}
          alt="Creatività ottimizzata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <span className="absolute left-3 top-3 rounded-full bg-slate-950/75 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
        Ottimizzata
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-slate-950/75 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
        Originale
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(15,23,42,.25)]"
        style={{ left: `${reveal}%` }}
      >
        <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-[#1954c6] text-sm font-black text-white shadow-lg">
          ↔
        </span>
      </span>
      <input
        aria-label="Confronta originale e versione ottimizzata"
        type="range"
        min={8}
        max={92}
        value={reveal}
        onChange={(event) => setReveal(Number(event.target.value))}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  )
}

export function CreativeWorkspace({
  point,
  asset,
  analyzed,
  error,
  onUpload,
  onAnalyzed,
  onApply,
  onClose,
}: CreativeWorkspaceProps) {
  const uploadId = useId()
  const replaceId = useId()
  const storedDisplay = useProjectStore(
    (state) => state.creativeDisplay[point.id],
  )
  const updateCreativeDisplay = useProjectStore(
    (state) => state.updateCreativeDisplay,
  )
  const display = { ...DEFAULT_CREATIVE_DISPLAY, ...storedDisplay }
  const [actionStage, setActionStage] = useState<ActionStage>('review')
  const stage = !asset ? 'upload' : analyzed ? actionStage : 'analyzing'
  const support = getSupportType(point.supportTypeId)
  const isPumpLeader = point.supportTypeId === '2'
  const isOptimized = asset?.id === PUMP_LEADER_OPTIMIZED_ASSET_ID
  const orientedAsset = asset
    ? point.supportShape === 'beach-flag'
      ? orientCreativeToPortrait(asset.width, asset.height)
      : { width: asset.width, height: asset.height }
    : undefined
  const fit = orientedAsset
    ? analyzeCreativeFit({
        assetWidth: orientedAsset.width,
        assetHeight: orientedAsset.height,
        surfaceWidth: point.width,
        surfaceHeight: point.height,
      })
    : null
  const hasFormatIssue = Boolean(fit && fit.status === 'mismatch')
  const hasCreativeIssues = isPumpLeader && !isOptimized

  useEffect(() => {
    if (!asset || analyzed) return
    const timer = window.setTimeout(() => onAnalyzed(asset.id), 1400)
    return () => window.clearTimeout(timer)
  }, [analyzed, asset, onAnalyzed])

  useEffect(() => {
    if (actionStage !== 'generating') return
    const timer = window.setTimeout(() => setActionStage('ready'), 1900)
    return () => window.clearTimeout(timer)
  }, [actionStage])

  const applyOptimized = () => {
    const optimized: MediaAsset = {
      id: PUMP_LEADER_OPTIMIZED_ASSET_ID,
      name: 'pump-leader-ottimizzato-ai.jpg',
      mimeType: 'image/jpeg',
      size: 116510,
      width: 720,
      height: 1019,
      aspectRatio: 720 / 1019,
      url: PUMP_LEADER_OPTIMIZED_URL,
    }
    onAnalyzed(optimized.id)
    onApply(optimized)
    onClose()
  }

  const fillAndConfirm = () => {
    updateCreativeDisplay(point.id, { fitMode: 'cover' })
    onClose()
  }

  const resetFraming = () =>
    updateCreativeDisplay(point.id, {
      ...DEFAULT_CREATIVE_DISPLAY,
      fitMode: display.fitMode,
    })
  const transformedImageStyle = {
    transform: `translate(${display.offsetX * 16}%, ${display.offsetY * 16}%) scale(${display.zoom}) rotate(${display.rotation}deg)`,
  }
  const replaceControl = (label = 'Sostituisci') => (
    <label
      htmlFor={replaceId}
      className="cursor-pointer rounded-full px-4 py-2.5 text-sm font-bold text-[#1954c6] transition hover:bg-blue-50"
    >
      <input
        id={replaceId}
        type="file"
        accept="image/jpeg,image/png,application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => onUpload(event.target.files?.[0])}
      />
      {label}
    </label>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Creatività ${point.name}`}
        className="flex h-[min(820px,calc(100dvh-40px))] w-full max-w-[1180px] flex-col overflow-hidden rounded-[28px] bg-[#f7f9fc] shadow-[0_30px_100px_rgba(15,23,42,.38)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-7">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#1954c6]">
              AI Creative Check · Supporto {point.number}
            </p>
            <h2 className="mt-1 truncate text-xl font-bold text-slate-950">
              {point.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi verifica creatività"
            className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </header>

        {stage === 'upload' ? (
          <main className="flex min-h-0 flex-1 p-7">
            <label
              htmlFor={uploadId}
              className="flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-300 bg-white px-8 text-center shadow-sm transition hover:border-[#1954c6] hover:bg-blue-50/40"
            >
              <input
                id={uploadId}
                type="file"
                accept="image/jpeg,image/png,application/pdf,.pdf"
                className="sr-only"
                onChange={(event) => onUpload(event.target.files?.[0])}
              />
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-[#1954c6]">
                <ImagePlus size={31} />
              </span>
              <span className="mt-5 text-xl font-bold text-slate-950">
                Carica la creatività
              </span>
              <span className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                JPEG, PNG o PDF · fino a 15 MB. Verificheremo formato e
                leggibilità nel contesto reale del supporto.
              </span>
              {error && (
                <span role="alert" className="mt-4 font-semibold text-red-600">
                  {error}
                </span>
              )}
            </label>
          </main>
        ) : stage === 'analyzing' || stage === 'generating' ? (
          <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-8">
            {asset && (
              <img
                src={asset.url}
                alt=""
                className="absolute inset-0 h-full w-full scale-105 object-cover opacity-[.08] blur-2xl"
              />
            )}
            <div role="status" className="relative max-w-md text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-[#1954c6] shadow-lg">
                {stage === 'generating' ? (
                  <WandSparkles className="animate-pulse" size={31} />
                ) : (
                  <LoaderCircle className="animate-spin" size={31} />
                )}
              </span>
              <h3 className="mt-5 text-2xl font-bold text-slate-950">
                {stage === 'generating'
                  ? 'Creo la versione ottimizzata…'
                  : 'Sto analizzando la creatività…'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {stage === 'generating'
                  ? 'Applico le correzioni mantenendo il concept originale.'
                  : 'Controllo formato e leggibilità nel contesto reale del supporto.'}
              </p>
            </div>
          </main>
        ) : (
          <>
            <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_360px] gap-5 overflow-hidden p-5">
              <section className="flex min-h-0 items-center justify-center overflow-hidden rounded-3xl bg-[#e8edf5] p-5">
                <div
                  className="relative max-h-full max-w-full overflow-hidden rounded-2xl bg-white shadow-xl"
                  style={{
                    aspectRatio: `${point.width} / ${point.height}`,
                    height: point.height >= point.width ? '100%' : 'auto',
                    width: point.width > point.height ? '100%' : 'auto',
                    backgroundColor: display.backgroundColor,
                  }}
                >
                  {asset &&
                    (stage === 'ready' && !isOptimized ? (
                      <BeforeAfterSlider originalUrl={asset.url} />
                    ) : (
                      <img
                        src={asset.url}
                        alt="Anteprima creatività sul supporto"
                        className={`h-full w-full transition-transform duration-200 ${display.fitMode === 'cover' ? 'object-cover' : 'object-contain'}`}
                        style={transformedImageStyle}
                      />
                    ))}
                  {stage === 'review' && hasCreativeIssues && (
                    <>
                      <ReviewMarker
                        number={1}
                        className="right-[8%] top-[6%]"
                      />
                      <ReviewMarker
                        number={2}
                        className="right-[12%] top-[43%]"
                      />
                      <ReviewMarker
                        number={3}
                        className="left-[12%] top-[78%]"
                      />
                    </>
                  )}
                </div>
              </section>

              <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-sm">
                {stage === 'ready' ? (
                  <div>
                    <CheckCircle2 className="text-emerald-600" size={30} />
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-700">
                      Variante pronta
                    </p>
                    <h3 className="mt-1.5 text-xl font-bold text-slate-950">
                      Più leggibile nel tempo disponibile
                    </h3>
                    <p className="mt-2 text-sm leading-5 text-slate-600">
                      Prodotto più grande, headline più leggibile e gerarchia
                      del footer corretta.
                    </p>
                  </div>
                ) : hasCreativeIssues ? (
                  <div>
                    <CircleAlert className="text-red-600" size={30} />
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-red-700">
                      Da migliorare
                    </p>
                    <h3 className="mt-1.5 text-xl font-bold text-slate-950">
                      Il messaggio non emerge abbastanza
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Dati del supporto: vista {support?.eyesOn ?? '1–2 s'} ·
                      distanza {support?.targetDistance ?? '1,5–3 m'}.
                    </p>
                    <ol className="mt-4 space-y-2.5">
                      {pumpIssues.map((issue, index) => (
                        <li
                          key={issue}
                          className="flex gap-2.5 text-xs leading-5 text-slate-700"
                        >
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-50 text-[10px] font-black text-red-700">
                            {index + 1}
                          </span>
                          {issue}
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : hasFormatIssue ? (
                  <div>
                    <CircleAlert className="text-red-600" size={30} />
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-red-700">
                      Da adattare
                    </p>
                    <h3 className="mt-1.5 text-xl font-bold text-slate-950">
                      Il formato lascia margini sul supporto
                    </h3>
                    <p className="mt-2 text-sm leading-5 text-slate-600">
                      Usa “Riempi” per adattarlo senza deformazioni, oppure
                      regola manualmente l’inquadratura.
                    </p>
                  </div>
                ) : (
                  <div>
                    <CheckCircle2 className="text-emerald-600" size={30} />
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-700">
                      Verifica completata
                    </p>
                    <h3 className="mt-1.5 text-xl font-bold text-slate-950">
                      La creatività è pronta
                    </h3>
                    <p className="mt-2 text-sm leading-5 text-slate-600">
                      Formato e leggibilità sono coerenti con questo supporto.
                    </p>
                  </div>
                )}

                {stage === 'review' && (
                  <div className="mt-auto border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">
                        Inquadratura nel supporto
                      </p>
                      <button
                        type="button"
                        onClick={resetFraming}
                        aria-label="Ripristina inquadratura"
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-bold">
                      {(['contain', 'cover'] as const).map((fitMode) => (
                        <button
                          key={fitMode}
                          type="button"
                          aria-pressed={display.fitMode === fitMode}
                          onClick={() =>
                            updateCreativeDisplay(point.id, { fitMode })
                          }
                          className={`rounded-lg px-3 py-2 transition ${display.fitMode === fitMode ? 'bg-white text-[#1954c6] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          {fitMode === 'contain' ? 'Intera' : 'Riempi'}
                        </button>
                      ))}
                    </div>
                    <label className="mt-3 block text-[11px] font-semibold text-slate-500">
                      Dimensione
                      <input
                        aria-label="Dimensione creatività"
                        type="range"
                        min={0.65}
                        max={1.8}
                        step={0.01}
                        value={display.zoom}
                        onChange={(event) =>
                          updateCreativeDisplay(point.id, {
                            zoom: Number(event.target.value),
                          })
                        }
                        className="mt-1 block w-full accent-[#1954c6]"
                      />
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <label className="text-[11px] font-semibold text-slate-500">
                        Orizzontale
                        <input
                          aria-label="Posizione orizzontale creatività"
                          type="range"
                          min={-1}
                          max={1}
                          step={0.01}
                          value={display.offsetX}
                          onChange={(event) =>
                            updateCreativeDisplay(point.id, {
                              offsetX: Number(event.target.value),
                            })
                          }
                          className="mt-1 block w-full accent-[#1954c6]"
                        />
                      </label>
                      <label className="text-[11px] font-semibold text-slate-500">
                        Verticale
                        <input
                          aria-label="Posizione verticale creatività"
                          type="range"
                          min={-1}
                          max={1}
                          step={0.01}
                          value={display.offsetY}
                          onChange={(event) =>
                            updateCreativeDisplay(point.id, {
                              offsetY: Number(event.target.value),
                            })
                          }
                          className="mt-1 block w-full accent-[#1954c6]"
                        />
                      </label>
                    </div>
                    <label className="mt-2 block text-[11px] font-semibold text-slate-500">
                      Rotazione
                      <input
                        aria-label="Rotazione creatività"
                        type="range"
                        min={-20}
                        max={20}
                        step={0.5}
                        value={display.rotation}
                        onChange={(event) =>
                          updateCreativeDisplay(point.id, {
                            rotation: Number(event.target.value),
                          })
                        }
                        className="mt-1 block w-full accent-[#1954c6]"
                      />
                    </label>
                  </div>
                )}
              </aside>
            </main>

            <footer className="flex h-[76px] shrink-0 items-center justify-end gap-1 border-t border-slate-200 bg-white px-7">
              {stage === 'ready' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActionStage('generating')}
                    className="rounded-full px-4 py-2.5 text-sm font-bold text-[#1954c6] hover:bg-blue-50"
                  >
                    Genera di nuovo
                  </button>
                  {replaceControl('Sostituisci')}
                  <button
                    type="button"
                    onClick={applyOptimized}
                    className="ml-2 rounded-full bg-[#1954c6] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#123f99]"
                  >
                    Conferma
                  </button>
                </>
              ) : hasCreativeIssues ? (
                <>
                  {replaceControl('Sostituisci')}
                  <button
                    type="button"
                    onClick={() => setActionStage('generating')}
                    className="ml-2 flex items-center gap-2 rounded-full bg-[#1954c6] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#123f99]"
                  >
                    <Sparkles size={17} /> Genera versione
                  </button>
                </>
              ) : (
                <>
                  {replaceControl('Sostituisci')}
                  <button
                    type="button"
                    onClick={fillAndConfirm}
                    className="rounded-full px-4 py-2.5 text-sm font-bold text-[#1954c6] hover:bg-blue-50"
                  >
                    Riempi
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="ml-2 rounded-full bg-[#1954c6] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#123f99]"
                  >
                    Conferma
                  </button>
                </>
              )}
            </footer>
          </>
        )}
      </section>
    </div>
  )
}
