import { useRef } from 'react'
import { StationConfigSchema, parseStationConfig, serializeStationConfig } from '@/domain/stationConfig'
import { useStationSetupStore, type SetupTool } from '@/stores/stationSetupStore'
import { meshPath } from '@/three/stationBounds'

const tools: Array<[SetupTool, string]> = [
  ['inspect', 'Inspect Mesh'],
  ['ground', 'Set Ground'],
  ['media', 'Add Media Point'],
  ['walk', 'Add Walk Point'],
]

const fmt = (values: number[]) => values.map((value) => value.toFixed(2)).join(', ')

export function StationSetupPanel() {
  const tool = useStationSetupStore((s) => s.tool)
  const setTool = useStationSetupStore((s) => s.setTool)
  const config = useStationSetupStore((s) => s.config)
  const loaded = useStationSetupStore((s) => s.configLoaded)
  const selected = useStationSetupStore((s) => s.selectedMesh)
  const currentView = useStationSetupStore((s) => s.currentView)
  const update = useStationSetupStore((s) => s.updateConfig)
  const initialize = useStationSetupStore((s) => s.initialize)
  const warning = useStationSetupStore((s) => s.warning)
  const setWarning = useStationSetupStore((s) => s.setWarning)
  const debug = useStationSetupStore((s) => s.debug)
  const toggleDebug = useStationSetupStore((s) => s.toggleDebug)
  const importRef = useRef<HTMLInputElement>(null)

  function hideSelected() {
    if (!selected) return
    const reference = meshPath(selected.object)
    update((value) => ({ ...value, hiddenMeshes: [...new Set([...value.hiddenMeshes, reference])] }))
  }
  function saveOverview() {
    if (currentView) update((value) => ({ ...value, overviewCamera: currentView }))
  }
  function addHotspot() {
    if (!currentView) return
    const index = config.hotspots.length + 1
    const name = window.prompt('Nome hotspot', `Hotspot ${index}`)?.trim()
    if (!name) return
    const minimum = config.ground?.y === undefined ? null : config.ground.y + 1.2
    if (minimum !== null && currentView.position[1] < minimum)
      setWarning(`Camera sotto la quota minima consigliata (${minimum.toFixed(2)} m). Hotspot salvato senza correzione.`)
    update((value) => ({ ...value, hotspots: [...value.hotspots, { ...currentView, id: `hotspot-${index}`, name }] }))
  }
  function exportConfig() {
    const parsed = StationConfigSchema.safeParse(config)
    if (!parsed.success) return setWarning(parsed.error.issues.map((issue) => issue.message).join(' · '))
    if (!config.ground || !config.overviewCamera)
      setWarning('Configurazione esportata, ma ground e/o overview non sono completi.')
    const blob = new Blob([serializeStationConfig(parsed.data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'station-config.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }
  async function importConfig(file?: File) {
    if (!file) return
    try {
      initialize(parseStationConfig(JSON.parse(await file.text())), true)
      setWarning(null)
    } catch (error) {
      setWarning(error instanceof Error ? error.message : 'JSON non valido.')
    }
  }

  return (
    <aside className="absolute right-3 top-3 z-30 max-h-[calc(100%-1.5rem)] w-80 overflow-y-auto rounded-xl border border-amber-400 bg-slate-950/95 p-4 text-xs text-white shadow-2xl">
      <p className="font-mono text-[10px] font-bold tracking-[.22em] text-amber-300">DEV / CALIBRATION</p>
      <h2 className="mt-1 text-lg font-black">STATION SETUP</h2>
      {!loaded && <p className="mt-2 rounded bg-amber-400/15 p-2 text-amber-200">Station not calibrated — configurazione locale vuota.</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {tools.map(([id, label]) => <button key={label} onClick={() => setTool(tool === id ? null : id)} className={`rounded px-2 py-2 font-semibold ${tool === id ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700'}`}>{label}</button>)}
        <button onClick={saveOverview} className="rounded bg-slate-800 px-2 py-2 font-semibold hover:bg-slate-700">Save Overview</button>
        <button onClick={addHotspot} className="rounded bg-slate-800 px-2 py-2 font-semibold hover:bg-slate-700">Add Hotspot</button>
      </div>
      {selected && <section className="mt-3 space-y-1 rounded bg-slate-900 p-3 font-mono text-[10px]">
        <b className="block text-amber-300">{selected.name}</b>
        <span className="block break-all">Path: {selected.path}</span>
        <span className="block">Parent: {selected.parent}</span>
        <span className="block">Material: {selected.materials.join(', ') || '—'}</span>
        <span className="block">Texture: {selected.textures.join(', ') || '—'}</span>
        <span className="block">World: {fmt(selected.position)}</span>
        <span className="block">Bounds: {fmt(selected.min)} → {fmt(selected.max)}</span>
        <span className="block">Size: {fmt(selected.size)} m · visible: {String(selected.visible)}</span>
        <button onClick={hideSelected} className="mt-2 w-full rounded bg-red-600 px-2 py-2 font-sans font-bold">Hide / Ignore Mesh</button>
      </section>}
      <section className="mt-3 rounded bg-slate-900 p-3">
        <b>Ground:</b> {config.ground?.y?.toFixed(3) ?? 'not set'} m<br />
        <b>Overview:</b> {config.overviewCamera ? 'saved' : 'not set'}<br />
        <b>Hotspots:</b> {config.hotspots.length} · <b>Media:</b> {config.mediaPoints.length} · <b>Walk:</b> {config.walkPath.length}
      </section>
      {config.hotspots.length > 0 && <section className="mt-3 space-y-1"><b>Hotspots</b>{config.hotspots.map((item) => <div key={item.id} className="flex justify-between rounded bg-slate-900 p-2"><span>{item.name}</span><button onClick={() => update((c) => ({ ...c, hotspots: c.hotspots.filter((h) => h.id !== item.id) }))} className="text-red-300">Delete</button></div>)}</section>}
      {config.mediaPoints.length > 0 && <section className="mt-3 space-y-1"><b>Media points</b>{config.mediaPoints.map((item) => <div key={item.id} className="rounded bg-slate-900 p-2"><div className="flex justify-between"><span>{item.number}. {item.name}</span><button onClick={() => update((c) => ({ ...c, mediaPoints: c.mediaPoints.filter((m) => m.id !== item.id) }))} className="text-red-300">Delete</button></div><div className="mt-1 grid grid-cols-2 gap-1">{(['width', 'height'] as const).map((key) => <label key={key}>{key}<input type="number" min="0.05" step="0.05" value={item[key]} onChange={(e) => update((c) => ({ ...c, mediaPoints: c.mediaPoints.map((m) => m.id === item.id ? { ...m, [key]: Number(e.target.value) } : m) }))} className="ml-1 w-14 bg-slate-700 px-1" /></label>)}</div>{(['position', 'rotation'] as const).map((vectorKey) => <div key={vectorKey} className="mt-1"><span>{vectorKey}</span><div className="grid grid-cols-3 gap-1">{item[vectorKey].map((value, axis) => <input key={axis} aria-label={`${vectorKey} ${axis}`} type="number" step={vectorKey === 'position' ? 0.01 : 1} value={Number(value.toFixed(3))} onChange={(event) => update((c) => ({ ...c, mediaPoints: c.mediaPoints.map((m) => { if (m.id !== item.id) return m; const vector = [...m[vectorKey]] as [number, number, number]; vector[axis] = Number(event.target.value); return { ...m, [vectorKey]: vector } }) }))} className="w-full bg-slate-700 px-1" />)}</div></div>)}</div>)}</section>}
      {config.walkPath.length > 0 && <section className="mt-3 space-y-1"><b>Walk path</b>{config.walkPath.map((item, index) => <div key={item.id} className="flex justify-between rounded bg-slate-900 p-2"><span>{item.id}</span><span><button disabled={!index} onClick={() => update((c) => { const points = [...c.walkPath]; [points[index - 1], points[index]] = [points[index]!, points[index - 1]!]; return { ...c, walkPath: points } })}>↑</button> <button onClick={() => update((c) => ({ ...c, walkPath: c.walkPath.filter((p) => p.id !== item.id) }))} className="text-red-300">Delete</button></span></div>)}</section>}
      <section className="mt-3 grid grid-cols-2 gap-1">{(Object.keys(debug) as Array<keyof typeof debug>).map((key) => <label key={key} className="flex gap-1"><input type="checkbox" checked={debug[key]} onChange={() => toggleDebug(key)} />{key}</label>)}</section>
      {warning && <p role="alert" className="mt-3 rounded bg-amber-300 p-2 text-slate-950">{warning}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={exportConfig} className="rounded bg-emerald-600 px-2 py-2 font-bold">Export Config</button><button onClick={() => importRef.current?.click()} className="rounded bg-blue-600 px-2 py-2 font-bold">Import Config</button></div>
      <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(event) => void importConfig(event.target.files?.[0])} />
    </aside>
  )
}
