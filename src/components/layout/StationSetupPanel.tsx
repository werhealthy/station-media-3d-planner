import { useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Eye,
  EyeOff,
  Flag,
  Footprints,
  ImagePlus,
  Layers3,
  MapPin,
  Rotate3D,
  Settings2,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { StationConfigSchema, parseStationConfig, serializeStationConfig } from '@/domain/stationConfig'
import { useStationSetupStore } from '@/stores/stationSetupStore'
import { useStationStore } from '@/stores/stationStore'
import { getStation } from '@/domain/stations'

const steps = [
  { label: 'Pulisci modello', icon: Sparkles },
  { label: 'Imposta pavimento', icon: Layers3 },
  { label: 'Imposta vista iniziale', icon: Rotate3D },
  { label: 'Aggiungi hotspot', icon: MapPin },
  { label: 'Spazi pubblicitari', icon: ImagePlus },
  { label: 'Percorso walkthrough', icon: Footprints },
  { label: 'Completa', icon: Flag },
] as const

const primaryButton = 'flex w-full items-center justify-center gap-2 rounded-xl bg-[#1746a2] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#123b8c] disabled:cursor-not-allowed disabled:opacity-40'
const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'

function Success({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-semibold text-emerald-800"><CheckCircle2 size={18} />{children}</div>
}

export function StationSetupPanel() {
  const [step, setStep] = useState(0)
  const [advanced, setAdvanced] = useState(false)
  const [managingHidden, setManagingHidden] = useState(false)
  const [hotspotDraft, setHotspotDraft] = useState(false)
  const [hotspotName, setHotspotName] = useState('')
  const tool = useStationSetupStore((s) => s.tool)
  const setTool = useStationSetupStore((s) => s.setTool)
  const config = useStationSetupStore((s) => s.config)
  const loaded = useStationSetupStore((s) => s.configLoaded)
  const selected = useStationSetupStore((s) => s.selectedMesh)
  const setSelectedMesh = useStationSetupStore((s) => s.setSelectedMesh)
  const selectedMediaPointId = useStationSetupStore((s) => s.selectedMediaPointId)
  const setSelectedMediaPoint = useStationSetupStore((s) => s.setSelectedMediaPoint)
  const currentView = useStationSetupStore((s) => s.currentView)
  const update = useStationSetupStore((s) => s.updateConfig)
  const initialize = useStationSetupStore((s) => s.initialize)
  const warning = useStationSetupStore((s) => s.warning)
  const setWarning = useStationSetupStore((s) => s.setWarning)
  const debug = useStationSetupStore((s) => s.debug)
  const toggleDebug = useStationSetupStore((s) => s.toggleDebug)
  const exitSetup = useStationSetupStore((s) => s.exitSetup)
  const previewView = useStationSetupStore((s) => s.previewView)
  const stationName = getStation(useStationStore((s) => s.selectedStationId)).name
  const importRef = useRef<HTMLInputElement>(null)
  const mediaDraft = config.mediaPoints.find((item) => item.id === selectedMediaPointId)

  function hideSelected() {
    if (!selected) return
    update((value) => ({ ...value, hiddenMeshes: [...new Set([...value.hiddenMeshes, selected.path])] }))
    setSelectedMesh(null)
    setTool(null)
  }
  function restoreMesh(reference: string) {
    update((value) => ({ ...value, hiddenMeshes: value.hiddenMeshes.filter((item) => item !== reference) }))
  }
  function saveOverview() {
    if (!currentView) return
    update((value) => ({ ...value, overviewCamera: currentView }))
  }
  function beginHotspot() {
    setHotspotDraft(true)
    setHotspotName(`Hotspot ${config.hotspots.length + 1}`)
  }
  function saveHotspot() {
    if (!currentView || !hotspotName.trim()) return
    const index = config.hotspots.length + 1
    update((value) => ({ ...value, hotspots: [...value.hotspots, { ...currentView, id: `hotspot-${index}`, name: hotspotName.trim() }] }))
    setHotspotDraft(false)
    setHotspotName('')
  }
  function exportConfig() {
    const parsed = StationConfigSchema.safeParse(config)
    if (!parsed.success) return setWarning('Controlla i dati inseriti prima di salvare.')
    if (!config.ground || !config.overviewCamera) return setWarning('Completa pavimento e vista iniziale prima di salvare.')
    const blob = new Blob([serializeStationConfig(parsed.data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'station-config.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setWarning(null)
  }
  async function importConfig(file?: File) {
    if (!file) return
    try {
      initialize(parseStationConfig(JSON.parse(await file.text())), true)
      setWarning(null)
    } catch (error) {
      if (import.meta.env.DEV) console.error('Station configuration import failed', error)
      setWarning('Impossibile caricare la configurazione.')
    }
  }
  const canContinue = step === 1 ? Boolean(config.ground) : step === 2 ? Boolean(config.overviewCamera) : true
  const descriptions = [
    'Seleziona eventuali elementi del modello che non devono essere visibili, come fondali, cupole o geometrie di rendering.',
    'Clicca sul pavimento principale della stazione.',
    'Posiziona la camera come vuoi che la stazione venga mostrata all’apertura.',
    'Aggiungi punti di vista predefiniti per mostrare la stazione da posizioni importanti.',
    'Clicca sulla superficie dove deve apparire una creatività.',
    'Definisci il percorso che una persona seguirà nella stazione.',
    'La configurazione è pronta. Controlla il riepilogo e salva il risultato.',
  ]
  const currentStep = steps[step] ?? steps[0]
  const Icon = currentStep.icon

  return (
    <aside aria-label="Configurazione stazione" className="absolute right-5 top-5 z-30 flex max-h-[calc(100%-2.5rem)] w-[430px] flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/95 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.24)] backdrop-blur-xl">
      <header className="border-b border-slate-100 px-6 pb-5 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#1746a2]">{stationName}</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">Configura stazione</h2><p className="mt-1 text-sm text-slate-500">Segui i passaggi per preparare il modello 3D.</p></div>
          <button onClick={exitSetup} aria-label="Chiudi configurazione" className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={20} /></button>
        </div>
        <div className="mt-5 flex gap-1.5" aria-label={`Passaggio ${step + 1} di ${steps.length}`}>
          {steps.map((item, index) => <button key={item.label} aria-label={`Vai a ${item.label}`} onClick={() => index <= step && setStep(index)} className={`h-1.5 flex-1 rounded-full transition ${index <= step ? 'bg-[#1746a2]' : 'bg-slate-200'}`} />)}
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500">Passaggio {step + 1} di {steps.length}</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {!loaded && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">Configurazione non ancora disponibile. Puoi crearne una nuova.</div>}
        <div className="mb-5 flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1746a2]"><Icon size={22} /></span><div><h3 className="text-lg font-bold text-slate-950">{currentStep.label}</h3><p className="mt-0.5 text-sm leading-5 text-slate-600">{descriptions[step]}</p></div></div>

        {step === 0 && <div className="space-y-3">
          {selected ? <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4"><p className="font-bold text-slate-900">Nascondere questo elemento?</p><p className="mt-1 text-sm text-slate-600">L’elemento evidenziato non sarà più visibile nella stazione.</p><div className="mt-4 flex gap-2"><button onClick={hideSelected} className="flex-1 rounded-xl bg-[#1746a2] px-4 py-2.5 text-sm font-bold text-white">Nascondi</button><button onClick={() => { setSelectedMesh(null); setTool(null) }} className={secondaryButton}>Annulla</button></div></div> : <button onClick={() => setTool(tool === 'inspect' ? null : 'inspect')} className={primaryButton}><EyeOff size={18} />{tool === 'inspect' ? 'Seleziona nella scena…' : 'Seleziona elemento da nascondere'}</button>}
          {config.hiddenMeshes.length > 0 && <Success>{config.hiddenMeshes.length} {config.hiddenMeshes.length === 1 ? 'elemento nascosto' : 'elementi nascosti'}</Success>}
          {config.hiddenMeshes.length > 0 && <button className="text-sm font-semibold text-[#1746a2]" onClick={() => setManagingHidden(!managingHidden)}>Gestisci elementi nascosti</button>}
          {managingHidden && <div className="space-y-2 rounded-xl bg-slate-50 p-3">{config.hiddenMeshes.map((reference, index) => <div key={reference} className="flex items-center justify-between text-sm"><span>Elemento {index + 1}</span><button onClick={() => restoreMesh(reference)} className="font-semibold text-[#1746a2]">Ripristina</button></div>)}</div>}
        </div>}

        {step === 1 && <div className="space-y-3">{config.ground ? <Success>Pavimento impostato</Success> : <button onClick={() => setTool('ground')} className={primaryButton}><Layers3 size={18} />{tool === 'ground' ? 'Clicca sul pavimento…' : 'Seleziona pavimento'}</button>}</div>}

        {step === 2 && <div className="space-y-3">{config.overviewCamera ? <><Success>Vista iniziale salvata</Success><div className="flex gap-2"><button onClick={() => config.overviewCamera && previewView(config.overviewCamera)} className={secondaryButton}><Eye size={17} />Anteprima</button><button onClick={saveOverview} className={secondaryButton}><Rotate3D size={17} />Aggiorna vista</button></div></> : <><div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Muovi, ruota e avvicina la camera direttamente nella scena.</div><button onClick={saveOverview} disabled={!currentView} className={primaryButton}><Check size={18} />Salva questa vista</button></>}</div>}

        {step === 3 && <div className="space-y-4">{hotspotDraft ? <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4"><p className="text-sm font-semibold text-slate-700">Posiziona la camera, poi assegna un nome.</p><label className="block text-sm font-semibold text-slate-700">Nome<input autoFocus value={hotspotName} onChange={(event) => setHotspotName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-blue-500" /></label><button onClick={saveHotspot} disabled={!currentView || !hotspotName.trim()} className={primaryButton}><MapPin size={18} />Salva hotspot</button></div> : <button onClick={beginHotspot} className={primaryButton}><MapPin size={18} />Aggiungi hotspot</button>}
          {config.hotspots.length > 0 && <section><h4 className="mb-2 text-sm font-bold">Hotspot</h4><div className="space-y-2">{config.hotspots.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"><span className="min-w-0 truncate text-sm font-semibold">{item.name}</span><span className="flex gap-1"><button aria-label={`Vai a ${item.name}`} onClick={() => previewView(item)} className="rounded-lg px-2 py-1.5 text-xs font-bold text-[#1746a2] hover:bg-blue-50">Vai</button><button aria-label={`Elimina ${item.name}`} onClick={() => update((c) => ({ ...c, hotspots: c.hotspots.filter((h) => h.id !== item.id) }))} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button></span></div>)}</div></section>}
        </div>}

        {step === 4 && <div className="space-y-4">{mediaDraft ? <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4"><label className="block text-sm font-semibold">Nome<input value={mediaDraft.name} onChange={(e) => update((c) => ({ ...c, mediaPoints: c.mediaPoints.map((m) => m.id === mediaDraft.id ? { ...m, name: e.target.value } : m) }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2" /></label><label className="block text-sm font-semibold">Tipo<select value={mediaDraft.type} onChange={(e) => update((c) => ({ ...c, mediaPoints: c.mediaPoints.map((m) => m.id === mediaDraft.id ? { ...m, type: e.target.value as 'digital' | 'print' } : m) }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"><option value="digital">Digital</option><option value="print">Print</option></select></label><div className="grid grid-cols-2 gap-3">{(['width', 'height'] as const).map((key) => <label key={key} className="text-sm font-semibold">{key === 'width' ? 'Larghezza' : 'Altezza'}<input type="number" min="0.05" step="0.05" value={mediaDraft[key]} onChange={(e) => update((c) => ({ ...c, mediaPoints: c.mediaPoints.map((m) => m.id === mediaDraft.id ? { ...m, [key]: Number(e.target.value) } : m) }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2" /></label>)}</div><button onClick={() => setSelectedMediaPoint(null)} className={primaryButton}><Check size={18} />Salva spazio</button></div> : <button onClick={() => setTool('media')} className={primaryButton}><ImagePlus size={18} />{tool === 'media' ? 'Clicca su una superficie…' : 'Aggiungi spazio pubblicitario'}</button>}
          {config.mediaPoints.length > 0 && <div className="space-y-2"><h4 className="text-sm font-bold">Spazi pubblicitari</h4>{config.mediaPoints.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5"><span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-xs font-bold">{item.number}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.name}</span><span className="text-xs font-semibold text-slate-500">{item.type === 'digital' ? 'Digital' : 'Print'}</span></div>)}</div>}
        </div>}

        {step === 5 && <div className="space-y-4"><button onClick={() => setTool(tool === 'walk' ? null : 'walk')} className={primaryButton}><Footprints size={18} />{tool === 'walk' ? 'Clicca sul pavimento…' : 'Aggiungi punto al percorso'}</button>{config.walkPath.length > 0 && <><div className="rounded-xl bg-slate-50 p-4"><h4 className="text-sm font-bold">Percorso</h4><div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-extrabold text-[#1746a2]">{config.walkPath.map((item, index) => <span key={item.id} className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-blue-100">{index + 1}</span>{index < config.walkPath.length - 1 && <ArrowRight size={14} />}</span>)}</div></div><div className="flex gap-2"><button onClick={() => update((c) => ({ ...c, walkPath: c.walkPath.slice(0, -1) }))} className={secondaryButton}><Undo2 size={16} />Annulla ultimo</button><button onClick={() => update((c) => ({ ...c, walkPath: [] }))} className={secondaryButton}><Trash2 size={16} />Cancella</button></div></>}</div>}

        {step === 6 && <div className="space-y-4"><div className="rounded-2xl bg-gradient-to-br from-blue-50 to-emerald-50 p-5"><h4 className="text-xl font-extrabold text-slate-950">Stazione pronta</h4><div className="mt-4 space-y-3 text-sm">{[[Boolean(config.ground), 'Pavimento impostato'], [Boolean(config.overviewCamera), 'Vista iniziale configurata'], [true, `${config.hotspots.length} hotspot`], [true, `${config.mediaPoints.length} spazi pubblicitari`], [true, config.walkPath.length ? 'Percorso walkthrough configurato' : 'Percorso walkthrough non configurato']].map(([done, label]) => <div key={String(label)} className="flex items-center gap-2 font-semibold text-slate-700">{done ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Circle size={18} className="text-slate-300" />}{label}</div>)}</div></div><button onClick={exportConfig} className={primaryButton}><Check size={18} />Salva configurazione</button><button onClick={() => setStep(0)} className={secondaryButton + ' w-full'}>Modifica configurazione</button></div>}

        {warning && <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{warning}</p>}
        <section className="mt-6 border-t border-slate-100 pt-4"><button onClick={() => setAdvanced(!advanced)} className="flex w-full items-center justify-between text-sm font-semibold text-slate-500"><span className="flex items-center gap-2"><Settings2 size={16} />Impostazioni avanzate</span>{advanced ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button>{advanced && <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3"><div className="grid grid-cols-2 gap-2">{(Object.keys(debug) as Array<keyof typeof debug>).map((key) => <label key={key} className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={debug[key]} onChange={() => toggleDebug(key)} />{key === 'bounds' ? 'Limiti utili' : key}</label>)}</div><div className="flex gap-2"><button onClick={exportConfig} className={secondaryButton}>Esporta</button><button onClick={() => importRef.current?.click()} className={secondaryButton}>Importa</button></div></div>}</section>
      </div>

      {step < 6 && <footer className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4"><button disabled={step === 0} onClick={() => setStep((value) => value - 1)} className={secondaryButton}><ArrowLeft size={16} />Indietro</button><button disabled={!canContinue} onClick={() => { setTool(null); setSelectedMesh(null); setStep((value) => value + 1) }} className="inline-flex items-center gap-2 rounded-xl bg-[#1746a2] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Continua<ArrowRight size={16} /></button></footer>}
      <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(event) => void importConfig(event.target.files?.[0])} />
    </aside>
  )
}
