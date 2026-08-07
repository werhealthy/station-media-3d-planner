import { TopBar } from './TopBar'
import { MediaPointPanel } from './MediaPointPanel'
import { Canvas } from '@/components/viewer/Canvas'
export function AppShell() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 text-slate-900">
      <TopBar />
      <main className="flex min-h-0 flex-1">
        <section className="relative min-w-0 flex-1">
          <Canvas />
          <div className="pointer-events-none absolute bottom-5 left-5 rounded-xl bg-white/90 px-4 py-3 text-xs text-slate-600 shadow-lg backdrop-blur">
            <b className="block text-sm text-slate-800">Esplora la stazione</b>
            Trascina per ruotare · scorri per avvicinare
          </div>
        </section>
        <MediaPointPanel />
      </main>
    </div>
  )
}
