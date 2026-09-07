import { useEffect, useState } from 'react'
import {
  Check,
  CheckCircle2,
  LoaderCircle,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react'
import type { MediaAsset } from '@/domain/schemas/media'

export const PUMP_LEADER_OPTIMIZED_URL =
  '/brand/q8/ai/pump-leader-optimized.jpg'
export const PUMP_LEADER_OPTIMIZED_ASSET_ID = 'mvp-ai-pump-leader-optimized'

type ReviewStage = 'analyzing' | 'issues' | 'generating' | 'ready' | 'applied'

const issues = [
  {
    title: 'Headline poco leggibile',
    copy: 'Il titolo è troppo piccolo e manca un fondo blu che separi il bianco dalla fotografia.',
  },
  {
    title: 'Prodotto poco protagonista',
    copy: 'La confezione occupa troppo poco spazio per essere riconosciuta alla distanza del Pump Leader.',
  },
  {
    title: 'Gerarchia del footer invertita',
    copy: 'La data domina la call to action “Ti bastano 25 litri”, che dovrebbe essere il messaggio principale.',
  },
]

function Marker({
  number,
  className,
  lineClassName,
}: {
  number: number
  className: string
  lineClassName: string
}) {
  return (
    <span className={`absolute ${className}`} aria-hidden="true">
      <span
        className={`absolute h-0.5 origin-left bg-red-500 ${lineClassName}`}
      />
      <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-600 text-white shadow-lg">
        <X size={14} strokeWidth={3} />
        <span className="sr-only">Problema {number}</span>
      </span>
    </span>
  )
}

export function PumpLeaderAiReview({
  asset,
  onApply,
}: {
  asset: MediaAsset
  onApply: (asset: MediaAsset) => void
}) {
  const [stage, setStage] = useState<ReviewStage>(
    asset.id === PUMP_LEADER_OPTIMIZED_ASSET_ID ? 'applied' : 'analyzing',
  )

  useEffect(() => {
    if (stage !== 'analyzing') return
    const timer = window.setTimeout(() => setStage('issues'), 1150)
    return () => window.clearTimeout(timer)
  }, [stage])

  useEffect(() => {
    if (stage !== 'generating') return
    const timer = window.setTimeout(() => setStage('ready'), 900)
    return () => window.clearTimeout(timer)
  }, [stage])

  const applyOptimizedAsset = () =>
    onApply({
      id: PUMP_LEADER_OPTIMIZED_ASSET_ID,
      name: 'pump-leader-ottimizzato-ai.jpg',
      mimeType: 'image/jpeg',
      size: 116510,
      width: 720,
      height: 1019,
      aspectRatio: 720 / 1019,
      url: PUMP_LEADER_OPTIMIZED_URL,
    })

  return (
    <section
      aria-live="polite"
      className="mt-4 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm"
    >
      <header className="bg-gradient-to-br from-[#092d78] via-[#164fb4] to-[#3676dc] p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-2.5">
            <span className="mt-0.5 rounded-lg bg-white/15 p-2">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-100">
                Creative Intelligence
              </p>
              <h3 className="mt-0.5 text-base font-bold">AI Creative Check</h3>
            </div>
          </div>
          <span className="rounded-full border border-white/25 bg-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider">
            AI preview
          </span>
        </div>
      </header>

      {stage === 'analyzing' && (
        <div role="status" className="flex items-center gap-3 p-5">
          <LoaderCircle
            className="shrink-0 animate-spin text-[#1954c6]"
            size={26}
          />
          <div>
            <p className="font-bold text-slate-900">Sto analizzando l’asset…</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Verifico leggibilità, gerarchia e visibilità alla distanza reale.
            </p>
          </div>
        </div>
      )}

      {stage === 'generating' && (
        <div role="status" className="flex items-center gap-3 p-5">
          <WandSparkles
            className="shrink-0 animate-pulse text-[#1954c6]"
            size={27}
          />
          <div>
            <p className="font-bold text-slate-900">
              Genero una variante ottimizzata…
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Sto applicando le tre correzioni proposte.
            </p>
          </div>
        </div>
      )}

      {stage === 'issues' && (
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-red-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
              <X size={15} strokeWidth={3} />
            </span>
            3 criticità rilevate
          </div>
          <div className="relative mx-auto w-[220px] overflow-visible rounded-lg bg-slate-100 shadow-sm">
            <img
              src={asset.url}
              alt="Creatività caricata con criticità evidenziate"
              className="aspect-[946/1339] w-full rounded-lg object-cover"
            />
            <Marker
              number={1}
              className="right-4 top-5"
              lineClassName="right-4 top-3 w-16 -rotate-[155deg]"
            />
            <Marker
              number={2}
              className="right-10 top-[42%]"
              lineClassName="right-4 top-3 w-14 rotate-[-165deg]"
            />
            <Marker
              number={3}
              className="left-10 top-[79%]"
              lineClassName="left-5 top-3 w-16 rotate-[18deg]"
            />
          </div>
          <ol className="mt-4 space-y-3">
            {issues.map((issue, index) => (
              <li key={issue.title} className="flex gap-2.5 text-xs">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-700">
                  {index + 1}
                </span>
                <span>
                  <strong className="block text-slate-800">
                    {issue.title}
                  </strong>
                  <span className="mt-0.5 block leading-4 text-slate-500">
                    {issue.copy}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-950">
            <strong>Intervento proposto:</strong> ingrandire prodotto e lead
            line, aggiungere il fondo blu di contrasto e riportare la promo
            sopra data e note legali.
          </div>
          <button
            type="button"
            onClick={() => setStage('generating')}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1954c6] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#123f99]"
          >
            <WandSparkles size={17} /> Genera versione ottimizzata
          </button>
        </div>
      )}

      {stage === 'ready' && (
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 size={20} /> Variante pronta
          </div>
          <img
            src={PUMP_LEADER_OPTIMIZED_URL}
            alt="Variante Pump Leader ottimizzata dall’AI"
            className="mx-auto aspect-[946/1339] w-[220px] rounded-lg bg-slate-100 object-cover shadow-sm"
          />
          <ul className="mt-4 space-y-2 text-xs leading-4 text-slate-600">
            {[
              'Prodotto ingrandito e subito riconoscibile',
              'Headline e lead line più visibili con contrasto blu',
              'Messaggio “Ti bastano 25 litri” promosso sopra data e legal',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <Check size={15} className="shrink-0 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={applyOptimizedAsset}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <CheckCircle2 size={17} /> Usa questa versione nel 3D
          </button>
        </div>
      )}

      {stage === 'applied' && (
        <div role="status" className="flex gap-3 bg-emerald-50 p-4">
          <CheckCircle2 className="shrink-0 text-emerald-600" size={22} />
          <div>
            <p className="text-sm font-bold text-emerald-950">
              Versione ottimizzata applicata
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-800">
              La nuova creatività è ora visibile sul Pump Leader nella scena.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
