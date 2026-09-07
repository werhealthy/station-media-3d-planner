import {
  CheckCircle2,
  CircleAlert,
  ImagePlus,
  LoaderCircle,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { MediaAsset } from '@/domain/schemas/media'
import type { ConfigMediaPoint } from '@/domain/stationConfig'
import {
  analyzeCreativeFit,
  orientCreativeToPortrait,
} from '@/core/creative/creativeFit'
import { getSupportType } from '@/domain/supportCatalog'
import { useProjectStore } from '@/stores/projectStore'

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
  'Headline troppo piccola per essere letta durante l’avvicinamento',
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
      className={`absolute grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-red-600 text-xs font-black text-white shadow-lg ${className}`}
      aria-label={`Criticità ${number}`}
    >
      {number}
    </span>
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
  const updateCreativeDisplay = useProjectStore(
    (state) => state.updateCreativeDisplay,
  )
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
  const shownUrl = stage === 'ready' ? PUMP_LEADER_OPTIMIZED_URL : asset?.url

  useEffect(() => {
    if (!asset || analyzed) return
    const timer = window.setTimeout(() => {
      onAnalyzed(asset.id)
    }, 900)
    return () => window.clearTimeout(timer)
  }, [analyzed, asset, onAnalyzed])

  useEffect(() => {
    if (actionStage !== 'generating') return
    const timer = window.setTimeout(() => setActionStage('ready'), 850)
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

  const confirmCurrent = () => {
    updateCreativeDisplay(point.id, { fitMode: 'cover' })
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Creatività ${point.name}`}
      className="fixed inset-0 z-50 flex h-dvh w-screen flex-col overflow-hidden bg-[#f5f7fb]"
    >
      <header className="flex h-[78px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
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
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          Chiudi <X size={18} />
        </button>
      </header>

      {stage === 'upload' ? (
        <label
          htmlFor={`creative-workspace-upload-${point.id}`}
          className="m-6 flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-300 bg-white text-center shadow-sm transition hover:border-[#1954c6] hover:bg-blue-50/40"
        >
          <input
            id={`creative-workspace-upload-${point.id}`}
            type="file"
            accept="image/jpeg,image/png,application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => onUpload(event.target.files?.[0])}
          />
          <span className="grid h-20 w-20 place-items-center rounded-3xl bg-blue-50 text-[#1954c6]">
            <ImagePlus size={38} />
          </span>
          <span className="mt-6 text-2xl font-bold text-slate-950">
            Carica la creatività
          </span>
          <span className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            JPEG, PNG o PDF · fino a 15 MB. Verificheremo automaticamente
            formato e leggibilità per questo supporto.
          </span>
          {error && (
            <span role="alert" className="mt-4 font-semibold text-red-600">
              {error}
            </span>
          )}
        </label>
      ) : stage === 'analyzing' ? (
        <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-8">
          {asset && (
            <img
              src={asset.url}
              alt="Creatività in analisi"
              className="absolute inset-0 h-full w-full scale-105 object-cover opacity-10 blur-xl"
            />
          )}
          <div role="status" className="relative text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-[#1954c6] shadow-lg">
              <LoaderCircle className="animate-spin" size={38} />
            </span>
            <h3 className="mt-6 text-2xl font-bold text-slate-950">
              Sto analizzando la creatività…
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Controllo formato e leggibilità nel contesto reale del supporto.
            </p>
          </div>
        </main>
      ) : (
        <>
          <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.25fr)_minmax(330px,.75fr)] gap-6 overflow-hidden p-6">
            <section className="flex min-h-0 items-center justify-center overflow-hidden rounded-3xl bg-[#e9edf4] p-6">
              <div
                className="relative max-h-full max-w-full overflow-hidden rounded-2xl bg-white shadow-xl"
                style={{
                  aspectRatio: `${point.width} / ${point.height}`,
                  height: point.height >= point.width ? '100%' : 'auto',
                  width: point.width > point.height ? '100%' : 'auto',
                }}
              >
                {shownUrl && (
                  <img
                    src={shownUrl}
                    alt={
                      stage === 'ready'
                        ? 'Variante ottimizzata'
                        : 'Anteprima creatività sul supporto'
                    }
                    className="h-full w-full object-cover"
                  />
                )}
                {stage === 'review' && hasCreativeIssues && (
                  <>
                    <ReviewMarker number={1} className="right-[8%] top-[6%]" />
                    <ReviewMarker
                      number={2}
                      className="right-[12%] top-[43%]"
                    />
                    <ReviewMarker number={3} className="left-[12%] top-[78%]" />
                  </>
                )}
              </div>
            </section>

            <section className="flex min-h-0 flex-col justify-center rounded-3xl bg-white p-8 shadow-sm">
              {stage === 'generating' ? (
                <div role="status" className="text-center">
                  <WandSparkles
                    className="mx-auto animate-pulse text-[#1954c6]"
                    size={42}
                  />
                  <h3 className="mt-5 text-2xl font-bold text-slate-950">
                    Creo la versione ottimizzata…
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Sto applicando le correzioni suggerite.
                  </p>
                </div>
              ) : stage === 'ready' ? (
                <div>
                  <CheckCircle2 className="text-emerald-600" size={36} />
                  <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-emerald-700">
                    Variante pronta
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">
                    Il messaggio ora emerge più rapidamente
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Prodotto più grande, headline più leggibile e gerarchia del
                    footer corretta.
                  </p>
                </div>
              ) : hasCreativeIssues ? (
                <div>
                  <CircleAlert className="text-red-600" size={36} />
                  <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-red-700">
                    Da migliorare
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">
                    Il messaggio non emerge nel tempo disponibile
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Valutazione contestuale: vista media{' '}
                    {support?.eyesOn ?? '1–2 s'}
                    {' · '}distanza {support?.targetDistance ?? '1,5–3 m'}.
                  </p>
                  <ol className="mt-6 space-y-3">
                    {pumpIssues.map((issue, index) => (
                      <li
                        key={issue}
                        className="flex gap-3 text-sm leading-5 text-slate-700"
                      >
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-red-50 text-xs font-black text-red-700">
                          {index + 1}
                        </span>
                        {issue}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : hasFormatIssue ? (
                <div>
                  <CircleAlert className="text-red-600" size={36} />
                  <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-red-700">
                    Da adattare
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">
                    Il formato non riempie correttamente il supporto
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Possiamo adattarlo senza deformazioni, usando un ritaglio
                    proporzionale ai margini.
                  </p>
                </div>
              ) : (
                <div>
                  <CheckCircle2 className="text-emerald-600" size={36} />
                  <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-emerald-700">
                    Verifica completata
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">
                    La creatività è pronta
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Formato e leggibilità sono coerenti con questo supporto.
                  </p>
                </div>
              )}
            </section>
          </main>

          <footer className="flex h-[82px] shrink-0 items-center justify-between border-t border-slate-200 bg-white px-8">
            <label
              htmlFor={`creative-workspace-replace-${point.id}`}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <input
                id={`creative-workspace-replace-${point.id}`}
                type="file"
                accept="image/jpeg,image/png,application/pdf,.pdf"
                className="sr-only"
                onChange={(event) => onUpload(event.target.files?.[0])}
              />
              <ImagePlus size={18} /> Sostituisci creatività
            </label>
            {stage === 'review' && hasCreativeIssues ? (
              <button
                type="button"
                onClick={() => setActionStage('generating')}
                className="flex items-center gap-2 rounded-xl bg-[#1954c6] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#123f99]"
              >
                <Sparkles size={18} /> Genera versione ottimizzata
              </button>
            ) : stage === 'ready' ? (
              <button
                type="button"
                onClick={applyOptimized}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                Usa questa versione nel 3D
              </button>
            ) : stage === 'review' ? (
              <button
                type="button"
                onClick={confirmCurrent}
                className="rounded-xl bg-[#1954c6] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#123f99]"
              >
                {hasFormatIssue ? 'Adatta e conferma' : 'Conferma nel 3D'}
              </button>
            ) : null}
          </footer>
        </>
      )}
    </div>
  )
}
