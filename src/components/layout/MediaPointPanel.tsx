import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  Info,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import type { ConfigMediaPoint } from '@/domain/stationConfig'
import { readImageAsset } from '@/domain/schemas/media'
import { getSupportType } from '@/domain/supportCatalog'
import { analyzeCreativeFit } from '@/core/creative/creativeFit'
import { BRAND_ASSETS } from '@/config/brandAssets'
import { useProjectStore } from '@/stores/projectStore'
import { useViewerStore } from '@/stores/viewerStore'

const millimetres = (metres: number) => Math.round(metres * 1000)
const ratioLabel = (ratio: number) => `${ratio.toFixed(2)}:1`

const dimensionSourceLabel = {
  documented: 'Quota documentata',
  reference: 'Quota dal riferimento',
  derived: 'Quota derivata',
  estimated: 'Quota da verificare',
} as const

export function MediaPointPanel({ points }: { points: ConfigMediaPoint[] }) {
  const selectedId = useViewerStore((state) => state.selectedMediaPointId)
  const select = useViewerStore((state) => state.selectMediaPoint)
  const assignments = useProjectStore((state) => state.assignments)
  const assign = useProjectStore((state) => state.assignAsset)
  const clear = useProjectStore((state) => state.clearAsset)
  const hiddenMediaPointIds = useProjectStore(
    (state) => state.hiddenMediaPointIds,
  )
  const toggleVisibility = useProjectStore(
    (state) => state.toggleMediaPointVisibility,
  )
  const showAll = useProjectStore((state) => state.showAllMediaPoints)
  const [error, setError] = useState('')
  const point = points.find((item) => item.id === selectedId)
  const asset = point ? assignments[point.id] : undefined
  const pointHidden = point ? hiddenMediaPointIds.includes(point.id) : false
  const usesSmartOptIdle = point?.supportTypeId === '11'
  const support = getSupportType(point?.supportTypeId)
  const fit =
    point && asset
      ? analyzeCreativeFit({
          assetWidth: asset.width,
          assetHeight: asset.height,
          surfaceWidth: point.width,
          surfaceHeight: point.height,
        })
      : null
  const recommendations = asset
    ? points
        .filter((item) => item.assignable)
        .map((item) => ({
          point: item,
          fit: analyzeCreativeFit({
            assetWidth: asset.width,
            assetHeight: asset.height,
            surfaceWidth: item.width,
            surfaceHeight: item.height,
          }),
        }))
        .sort(
          (left, right) =>
            left.fit.differencePercent - right.fit.differencePercent ||
            left.point.number - right.point.number,
        )
        .slice(0, 3)
    : []

  async function upload(file?: File) {
    if (!file || !point) return
    setError('')
    try {
      assign(point.id, await readImageAsset(file))
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Upload non riuscito.',
      )
    }
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
              {points.length} supporti
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
            {points.map((item) => {
              const isHidden = hiddenMediaPointIds.includes(item.id)
              return (
                <div
                  key={item.id}
                  className={`flex items-center rounded-xl border transition ${isHidden ? 'border-slate-200 bg-slate-50 opacity-65' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'}`}
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
              <div className="min-w-0">
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
            </div>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Proprietà
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
                <dt className="text-slate-500">Quota da terra</dt>
                <dd className="text-right font-semibold tabular-nums">
                  {millimetres(point.heightFromGround ?? point.position[1])} mm
                </dd>
              </dl>
              <button
                type="button"
                onClick={() => toggleVisibility(point.id)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                {pointHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                {pointHidden ? 'Mostra nella scena' : 'Nascondi dalla scena'}
              </button>
              {support && (
                <div
                  className={`mt-4 rounded-xl border p-3 text-xs leading-5 ${support.dimensions.source === 'estimated' ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-blue-100 bg-blue-50/70 text-blue-950'}`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {support.dimensions.source === 'estimated' ? (
                      <AlertTriangle size={15} />
                    ) : (
                      <Info size={15} />
                    )}
                    {dimensionSourceLabel[support.dimensions.source]}
                  </div>
                  <p className="mt-1 opacity-75">{support.dimensions.note}</p>
                </div>
              )}
            </section>

            {support && (
              <section>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Regole di lettura
                </h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Distanza target</dt>
                    <dd className="font-semibold text-slate-800">
                      {support.targetDistance}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Tempo eyes-on</dt>
                    <dd className="font-semibold text-slate-800">
                      {support.eyesOn}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Volume massimo</dt>
                    <dd className="font-semibold text-slate-800">
                      {support.maxWords}
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Creatività assegnata
              </h3>
              {!point.assignable ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  Questo elemento ha funzione strutturale o normativa e non è
                  configurabile come spazio pubblicitario.
                </div>
              ) : asset ? (
                <>
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
                        className="rounded-md p-1 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
                      {asset.width} × {asset.height} px ·{' '}
                      {ratioLabel(asset.aspectRatio)}
                    </div>
                  </div>
                  {fit && (
                    <div
                      role="status"
                      className={`mt-3 rounded-xl border p-3 text-sm ${fit.status === 'exact' ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-950'}`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        {fit.status === 'exact' ? (
                          <CheckCircle2 size={17} />
                        ) : (
                          <AlertTriangle size={17} />
                        )}
                        {fit.status === 'exact'
                          ? 'Proporzioni corrette'
                          : 'Proporzioni diverse dal supporto'}
                      </div>
                      <p className="mt-1 text-xs leading-5 opacity-80">
                        Richiesto {ratioLabel(fit.surfaceRatio)} · caricato{' '}
                        {ratioLabel(fit.assetRatio)} · differenza{' '}
                        {fit.differencePercent.toFixed(1)}%
                      </p>
                    </div>
                  )}
                  {fit && fit.status !== 'exact' && (
                    <p className="mt-2 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                      La creatività viene mostrata interamente e non viene mai
                      ritagliata o deformata. Circa{' '}
                      {fit.containUnusedPercent.toFixed(0)}% del supporto rimane
                      libero.
                    </p>
                  )}
                  {recommendations.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-slate-500">
                        Supporti consigliati per questo formato
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {recommendations.map((recommendation) => (
                          <button
                            type="button"
                            key={recommendation.point.id}
                            onClick={() => select(recommendation.point.id)}
                            className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-xs hover:border-blue-300 hover:bg-blue-50"
                          >
                            <span className="font-semibold text-slate-700">
                              {recommendation.point.number}.{' '}
                              {recommendation.point.name}
                            </span>
                            <span className="tabular-nums text-slate-400">
                              Δ{' '}
                              {recommendation.fit.differencePercent.toFixed(1)}%
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {usesSmartOptIdle && (
                    <div className="mb-3 overflow-hidden rounded-xl border border-blue-100 bg-[#eef2f7]">
                      <img
                        src={BRAND_ASSETS.smartOptIdle}
                        alt="Schermata idle Q8 del terminale smartOPT Maxi"
                        className="mx-auto h-64 object-contain p-3"
                      />
                      <div className="border-t border-blue-100 bg-white px-3 py-2">
                        <p className="text-xs font-bold text-[#153276]">
                          Schermata idle Q8 predefinita
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Visualizzata nel display verticale finché non assegni
                          una creatività diversa.
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    id={`creative-upload-${point.id}`}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    onChange={(event) => void upload(event.target.files?.[0])}
                  />
                  <label
                    htmlFor={`creative-upload-${point.id}`}
                    className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-4 py-8 text-center hover:bg-blue-50"
                  >
                    <ImagePlus className="mb-3 text-[#1954c6]" />
                    <span className="font-semibold text-slate-800">
                      {usesSmartOptIdle
                        ? 'Sostituisci la schermata idle'
                        : 'Carica JPEG o PNG'}
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      Rapporto richiesto{' '}
                      {ratioLabel(point.width / point.height)} · massimo 15 MB
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
