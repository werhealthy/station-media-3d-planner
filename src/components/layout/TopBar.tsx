import { Redo2, Download, Upload, Pause, Play } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useUiStore, type ViewMode } from '@/stores/uiStore'
import { useProjectStore } from '@/stores/projectStore'
import { usePlaybackStore } from '@/stores/playbackStore'
import { cn } from '@/lib/cn'

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'hotspot', label: 'Hotspot' },
  { id: 'walkthrough', label: 'Walkthrough' },
]

export function TopBar() {
  const projectName = useProjectStore((s) => s.projectName)
  const viewMode = useUiStore((s) => s.viewMode)
  const setViewMode = useUiStore((s) => s.setViewMode)
  const isPlaying = usePlaybackStore((s) => s.isPlaying)
  const play = usePlaybackStore((s) => s.play)
  const pause = usePlaybackStore((s) => s.pause)

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-semibold text-slate-900">
          {projectName}
        </span>
      </div>

      <select
        aria-label="Seleziona stazione"
        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700"
        disabled
      >
        <option>Stazione dimostrativa (Fase 2)</option>
      </select>

      <nav
        aria-label="Modalita' di visualizzazione"
        className="ml-auto flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1"
      >
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            aria-pressed={viewMode === mode.id}
            onClick={() => setViewMode(mode.id)}
            className={cn(
              'rounded px-3 py-1 text-sm font-medium transition-colors',
              viewMode === mode.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {mode.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isPlaying ? 'Pausa' : 'Riproduci'}
          title={isPlaying ? 'Pausa' : 'Riproduci'}
          onClick={() => (isPlaying ? pause() : play())}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Reset camera"
          title="Reset camera"
        >
          <Redo2 size={16} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Importa progetto (disponibile dalla Fase 7)"
          disabled
        >
          <Upload size={14} /> Importa
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Esporta progetto (disponibile dalla Fase 7)"
          disabled
        >
          <Download size={14} /> Esporta
        </Button>
      </div>
    </header>
  )
}
